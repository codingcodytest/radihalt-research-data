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

function parseCsv(path) {
  const input = readText(path).replace(/\r\n/g, "\n");
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];

    if (inQuotes) {
      if (character === '"' && input[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        inQuotes = false;
      } else {
        field += character;
      }
    } else if (character === '"') {
      assert(field.length === 0, `${path}: unexpected quote in CSV field`);
      inQuotes = true;
    } else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\n") {
      row.push(field);
      if (!(row.length === 1 && row[0] === "")) rows.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }

  assert(!inQuotes, `${path}: unclosed quoted CSV field`);
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  assert(rows.length > 1, `${path} must include a header and at least one record`);
  const headers = rows.shift().map((value, index) => (
    index === 0 ? value.replace(/^\uFEFF/, "") : value
  ));
  assert(new Set(headers).size === headers.length, `${path}: duplicate CSV header`);

  const records = rows.map((values, index) => {
    assert(
      values.length === headers.length,
      `${path}: row ${index + 2} has ${values.length} fields; expected ${headers.length}`,
    );
    return Object.fromEntries(headers.map((header, column) => [header, values[column]]));
  });

  return { headers, records };
}

function csvRecordCount(path) {
  return parseCsv(path).records.length;
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

function hasValidGtinCheckDigit(value, length) {
  if (typeof value !== "string" || !new RegExp(`^\\d{${length}}$`).test(value)) {
    return false;
  }

  const digits = [...value].map(Number);
  let sum = 0;
  let multiplier = 3;
  for (let index = digits.length - 2; index >= 0; index -= 1) {
    sum += digits[index] * multiplier;
    multiplier = multiplier === 3 ? 1 : 3;
  }
  const expectedCheckDigit = (10 - (sum % 10)) % 10;
  return digits.at(-1) === expectedCheckDigit;
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
assert(Array.isArray(manifest.datasets) && manifest.datasets.length === 3, "manifest.json: expected exactly three datasets");
assert(
  new Set(manifest.datasets.map((dataset) => dataset.id)).size === manifest.datasets.length,
  "manifest.json: dataset IDs must be unique",
);
assert(
  new Set(manifest.datasets.map((dataset) => dataset.directory)).size === manifest.datasets.length,
  "manifest.json: dataset directories must be unique",
);

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
  } else if (dataset.id === "product-specifications") {
    const ids = release.records.map((record) => record.record_id);
    assert(new Set(ids).size === ids.length, `${dataset.id}: duplicate record ID`);
    validateUrls(release.records, ["product_url"], dataset.id);

    const releaseKeys = Object.keys(release);
    const licenseIndex = releaseKeys.indexOf("license");
    assert(
      releaseKeys.slice(licenseIndex, licenseIndex + 4).join(",") ===
        "license,doi,repository_url,methodology_url",
      `${dataset.id}: release identity fields must follow license in stable order`,
    );
    assert(release.doi === dataset.doi, `${dataset.id}: JSON DOI does not match manifest`);
    assert(
      release.repository_url === `${manifest.repository}/tree/main/${dataset.directory}`,
      `${dataset.id}: JSON repository URL does not match release directory`,
    );

    const shared = release.shared_specification;
    assert(shared && typeof shared === "object", `${dataset.id}: missing shared specification`);
    assert(
      shared.inner_faraday_fabric === "60% polyester / 32% copper / 8% nickel (supplier-confirmed 2026-07-26)",
      `${dataset.id}: unexpected inner Faraday fabric specification`,
    );
    assert(
      shared.specification_evidence_status === "supplier_confirmed_current_production_spec_not_independently_tested",
      `${dataset.id}: unexpected specification evidence status`,
    );
    assert(
      release.limitations?.some((limitation) => limitation.includes("not been independently verified")),
      `${dataset.id}: independent-verification boundary is missing`,
    );
    assert(
      release.limitations?.some((limitation) => limitation.includes("does not report attenuation")),
      `${dataset.id}: performance-reporting boundary is missing`,
    );

    const csv = parseCsv(csvPath);
    const csvById = new Map(csv.records.map((record) => [record.record_id, record]));
    assert(csvById.size === csv.records.length, `${dataset.id}: duplicate CSV record ID`);

    const sharedCsvFields = [
      "brand",
      "product_family",
      "country_of_origin",
      "product_type",
      "power_status",
      "construction",
      "outer_textile_and_binding",
      "inner_faraday_fabric",
      "specification_evidence_status",
      "specification_effective_date",
      "care_summary",
    ];
    const recordCsvFields = [
      "variant_label",
      "asin",
      "original_amazon_seller_sku",
      "upc_gtin12",
      "gtin13",
      "color",
      "product_url",
    ];

    for (const record of release.records) {
      assert(/^[a-z0-9-]+$/.test(record.record_id), `${dataset.id}: invalid record ID`);
      assert(/^[A-Z0-9]{10}$/.test(record.asin), `${dataset.id}: invalid ASIN for ${record.record_id}`);
      assert(record.original_amazon_seller_sku, `${dataset.id}: missing original seller SKU for ${record.record_id}`);
      assert(hasValidGtinCheckDigit(record.upc_gtin12, 12), `${dataset.id}: invalid UPC/GTIN-12 for ${record.record_id}`);
      assert(hasValidGtinCheckDigit(record.gtin13, 13), `${dataset.id}: invalid GTIN-13 for ${record.record_id}`);
      assert(record.gtin13 === `0${record.upc_gtin12}`, `${dataset.id}: GTIN-13 does not match UPC for ${record.record_id}`);
      assert(Number.isFinite(record.width_in) && record.width_in > 0, `${dataset.id}: invalid width for ${record.record_id}`);
      assert(Number.isFinite(record.length_in) && record.length_in > 0, `${dataset.id}: invalid length for ${record.record_id}`);
      assert(["Grey", "Black"].includes(record.color), `${dataset.id}: unexpected color for ${record.record_id}`);
      assert(
        record.product_url === `https://www.amazon.com/dp/${record.asin}`,
        `${dataset.id}: product URL does not match ASIN for ${record.record_id}`,
      );

      const csvRecord = csvById.get(record.record_id);
      assert(csvRecord, `${dataset.id}: CSV is missing ${record.record_id}`);
      for (const field of recordCsvFields) {
        assert(csvRecord[field] === String(record[field]), `${dataset.id}: CSV ${field} differs for ${record.record_id}`);
      }
      assert(Number(csvRecord.width_in) === record.width_in, `${dataset.id}: CSV width differs for ${record.record_id}`);
      assert(Number(csvRecord.length_in) === record.length_in, `${dataset.id}: CSV length differs for ${record.record_id}`);
      for (const field of sharedCsvFields) {
        assert(csvRecord[field] === String(shared[field]), `${dataset.id}: CSV ${field} differs for ${record.record_id}`);
      }
      assert(csvRecord.last_reviewed === release.last_reviewed, `${dataset.id}: CSV review date differs for ${record.record_id}`);
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

  const zenodoPaths = {
    "emf-evidence-index": "metadata/zenodo/emf-evidence-index-v2026-09-22.json",
    "phone-sar": "metadata/zenodo/phone-sar-v2026-04-27.json",
    "product-specifications": "metadata/zenodo/product-specifications-v2026-09-22.json",
  };
  const zenodoPath = zenodoPaths[dataset.id];
  assert(zenodoPath, `${dataset.id}: missing Zenodo metadata mapping`);
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
