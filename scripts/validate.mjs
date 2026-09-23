import { createHash } from "node:crypto";
import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
} from "node:fs";
import { extname, join, relative, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");

function fail(message) {
  throw new Error(message);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function readText(path) {
  return readFileSync(join(ROOT, path), "utf8");
}

function readJson(path) {
  try {
    return JSON.parse(readText(path));
  } catch (error) {
    fail(`${path} is not valid JSON: ${error.message}`);
  }
}

function csvRecordCount(path) {
  const rows = readText(path)
    .replace(/\r\n/g, "\n")
    .trimEnd()
    .split("\n");
  assert(rows.length > 1, `${path} must include a header and at least one record`);
  return rows.length - 1;
}

function walkFiles(directory) {
  const absolute = join(ROOT, directory);
  const entries = readdirSync(absolute, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const child = join(absolute, entry.name);
    if (entry.isDirectory()) {
      return walkFiles(relative(ROOT, child));
    }
    return [relative(ROOT, child)];
  });
}

function sha256(path) {
  return createHash("sha256")
    .update(readFileSync(join(ROOT, path)))
    .digest("hex");
}

function validateUrls(records, fields, datasetId) {
  for (const record of records) {
    for (const field of fields) {
      const value = record[field];
      assert(
        typeof value === "string" && value.startsWith("https://"),
        `${datasetId}: ${field} must be an HTTPS URL`,
      );
    }
  }
}

function validateCitation(path, title, version, doi) {
  const citation = readText(path);
  assert(citation.includes("cff-version: 1.2.0"), `${path}: missing CFF 1.2.0 declaration`);
  assert(citation.includes(`title: "${title}"`), `${path}: title does not match release`);
  assert(citation.includes(`version: "${version}"`), `${path}: version does not match release`);
  assert(citation.includes("license: CC-BY-4.0"), `${path}: missing CC BY 4.0 license`);
  assert(citation.includes('name: "RADIHALT Research"'), `${path}: missing organizational creator`);
  assert(!/^publisher:/m.test(citation), `${path}: publisher is not a valid top-level CFF 1.2 key`);
  if (doi) {
    assert(citation.includes(`doi: "${doi}"`), `${path}: DOI does not match manifest`);
  }
}

function validateZenodoMetadata(path, title, version, landingPage) {
  const metadata = readJson(path);
  assert(metadata.upload_type === "dataset", `${path}: upload_type must be dataset`);
  assert(metadata.title === title, `${path}: title does not match release`);
  assert(metadata.version === version, `${path}: version does not match release`);
  assert(metadata.license === "cc-by-4.0", `${path}: license must be cc-by-4.0`);
  assert(
    metadata.creators?.some((creator) => creator.name === "RADIHALT Research"),
    `${path}: missing RADIHALT Research creator`,
  );
  assert(
    metadata.related_identifiers?.some(
      (identifier) => identifier.identifier === landingPage,
    ),
    `${path}: missing canonical landing-page relation`,
  );
}

const manifest = readJson("manifest.json");
assert(manifest.name === "RADIHALT Research Data", "manifest.json: unexpected collection name");
assert(manifest.license === "https://creativecommons.org/licenses/by/4.0/", "manifest.json: unexpected license");
assert(Array.isArray(manifest.datasets) && manifest.datasets.length === 2, "manifest.json: expected exactly two datasets");

let totalRecords = 0;

for (const dataset of manifest.datasets) {
  assert(/^[a-z0-9-]+$/.test(dataset.id), `${dataset.id}: invalid dataset ID`);
  assert(/^\d{4}-\d{2}-\d{2}$/.test(dataset.version), `${dataset.id}: invalid version`);
  assert(/^10\.5281\/zenodo\.\d+$/.test(dataset.doi), `${dataset.id}: invalid Zenodo DOI`);
  assert(dataset.landingPage.startsWith("https://radihalt.com/"), `${dataset.id}: unexpected landing page`);
  assert(Array.isArray(dataset.files) && dataset.files.length === 3, `${dataset.id}: expected CSV, JSON, and BibTeX files`);

  const extensions = dataset.files.map((path) => extname(path)).sort();
  assert(
    JSON.stringify(extensions) === JSON.stringify([".bib", ".csv", ".json"]),
    `${dataset.id}: release files must be CSV, JSON, and BibTeX`,
  );

  for (const path of dataset.files) {
    assert(existsSync(join(ROOT, path)), `${dataset.id}: missing ${path}`);
  }

  const csvPath = dataset.files.find((path) => path.endsWith(".csv"));
  const jsonPath = dataset.files.find((path) => path.endsWith(".json"));
  const bibPath = dataset.files.find((path) => path.endsWith(".bib"));
  const release = readJson(jsonPath);

  assert(release.name === dataset.title, `${dataset.id}: JSON title does not match manifest`);
  assert(release.version === dataset.version, `${dataset.id}: JSON version does not match manifest`);
  assert(Array.isArray(release.records), `${dataset.id}: JSON records must be an array`);
  assert(release.records.length === dataset.records, `${dataset.id}: JSON record count does not match manifest`);
  assert(csvRecordCount(csvPath) === dataset.records, `${dataset.id}: CSV record count does not match manifest`);
  const bibtex = readText(bibPath);
  assert(bibtex.startsWith("@dataset{"), `${dataset.id}: BibTeX must use the dataset entry type`);
  assert(bibtex.includes(`doi = {${dataset.doi}}`), `${dataset.id}: BibTeX DOI does not match manifest`);

  if (dataset.id === "emf-evidence-index") {
    const ids = release.records.map((record) => record.id);
    assert(new Set(ids).size === ids.length, `${dataset.id}: duplicate record ID`);
    validateUrls(release.records, ["primary_source_url", "radihalt_guide_url"], dataset.id);
    for (const record of release.records) {
      assert(record.source_reference, `${dataset.id}: missing source reference`);
      assert(record.source_role_label, `${dataset.id}: missing source-role label`);
    }
  } else if (dataset.id === "phone-sar") {
    const slugs = release.records.map((record) => record.slug);
    assert(new Set(slugs).size === slugs.length, `${dataset.id}: duplicate phone slug`);
    validateUrls(release.records, ["detail_url"], dataset.id);
    for (const record of release.records) {
      assert(record.fcc_id, `${dataset.id}: missing FCC ID`);
      assert(Number.isFinite(record.head_sar_w_kg) && record.head_sar_w_kg >= 0, `${dataset.id}: invalid head SAR`);
      assert(Number.isFinite(record.body_sar_w_kg) && record.body_sar_w_kg >= 0, `${dataset.id}: invalid body SAR`);
    }
  } else {
    fail(`manifest.json: unsupported dataset ${dataset.id}`);
  }

  const citationPath = `${dataset.directory}/CITATION.cff`;
  const readmePath = `${dataset.directory}/README.md`;
  assert(existsSync(join(ROOT, readmePath)), `${dataset.id}: missing release README`);
  validateCitation(citationPath, dataset.title, dataset.version, dataset.doi);
  assert(
    readText(readmePath).includes(`https://doi.org/${dataset.doi}`),
    `${dataset.id}: release README DOI does not match manifest`,
  );

  const zenodoPath = dataset.id === "emf-evidence-index"
    ? "metadata/zenodo/emf-evidence-index-v2026-09-22.json"
    : "metadata/zenodo/phone-sar-v2026-04-27.json";
  validateZenodoMetadata(zenodoPath, dataset.title, dataset.version, dataset.landingPage);

  totalRecords += dataset.records;
}

const checksumEntries = readText("SHA256SUMS")
  .trim()
  .split("\n")
  .map((line) => {
    const match = line.match(/^([a-f0-9]{64})  (.+)$/);
    assert(match, `SHA256SUMS: invalid line ${line}`);
    return { expected: match[1], path: match[2] };
  });

const releaseFiles = manifest.datasets
  .flatMap((dataset) => walkFiles(dataset.directory))
  .sort();
const checksumPaths = checksumEntries.map((entry) => entry.path).sort();
assert(
  JSON.stringify(releaseFiles) === JSON.stringify(checksumPaths),
  "SHA256SUMS must cover every release file exactly once",
);

for (const entry of checksumEntries) {
  assert(statSync(join(ROOT, entry.path)).isFile(), `SHA256SUMS: missing ${entry.path}`);
  assert(sha256(entry.path) === entry.expected, `SHA256SUMS: mismatch for ${entry.path}`);
}

validateCitation("CITATION.cff", "RADIHALT Research Data", "2026.09.22");

console.log(
  `Validated ${manifest.datasets.length} datasets, ${totalRecords} records, and ${checksumEntries.length} checksums.`,
);
