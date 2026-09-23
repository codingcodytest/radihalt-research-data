# RADIHALT Research Data

Open, versioned research data maintained by [RADIHALT Research](https://radihalt.com/editorial-policy)
so readers can independently inspect, cite, and reuse the source work behind
RADIHALT's EMF education.

This repository publishes the underlying records for RADIHALT's public EMF
source directory and phone SAR database. It exists so journalists,
researchers, educators, developers, and readers can inspect release history,
reuse preservation-friendly files, cite a fixed version, and report a
correction in public.

## Current datasets

| Dataset | Version | Records | Formats | DOI | Public guide | Release files |
| --- | --- | ---: | --- | --- | --- | --- |
| RADIHALT EMF Evidence Source Index | 2026-09-22 | 23 | CSV, JSON, BibTeX | [10.5281/zenodo.22908519](https://doi.org/10.5281/zenodo.22908519) | [Browse the evidence index](https://radihalt.com/emf-studies) | [`data/emf-evidence-index/v2026-09-22`](data/emf-evidence-index/v2026-09-22) |
| RADIHALT Phone SAR Dataset | 2026-04-27 | 28 | CSV, JSON, BibTeX | [10.5281/zenodo.22908624](https://doi.org/10.5281/zenodo.22908624) | [Search the SAR database](https://radihalt.com/sar) | [`data/phone-sar/v2026-04-27`](data/phone-sar/v2026-04-27) |

Each version directory includes its own README and `CITATION.cff`. The
repository-level [`manifest.json`](manifest.json) lists the canonical landing
page, current version, record count, license, and release files for both
datasets. [`SHA256SUMS`](SHA256SUMS) provides integrity hashes.

## What the datasets cover

### EMF Evidence Source Index

RADIHALT Research maintains this curated discovery directory to make important
EMF evidence easier to inspect, compare, and cite. It spans regulators,
national standards, precautionary frameworks, research bodies,
classifications, physician guidance, and peer-reviewed studies. Every record
includes an editorial role, original reference, primary-source URL, and
permanent RADIHALT guide URL.

This is not a systematic review and inclusion does not imply that every source
agrees with RADIHALT or with every other source.

### Phone SAR Dataset

RADIHALT Research publishes this reviewed snapshot to make U.S. FCC phone SAR
data easier to compare, verify, and cite. It covers 1-gram head and body
Specific Absorption Rate values for selected Apple, Samsung, and Google phones
released from 2020 through 2024. Every record includes the model, release year,
head SAR, body SAR, FCC ID, and permanent RADIHALT detail-page URL.

SAR is a maximum-power compliance measurement. It does not predict a person's
typical exposure or health outcome. The collection is not an exhaustive live
catalog of every phone currently sold.

## Method, provenance, and corrections

- Read [`docs/METHODOLOGY.md`](docs/METHODOLOGY.md) for selection, provenance,
  validation, versioning, and limitation details.
- Use the issue forms to report a data correction or propose an authoritative
  source. Include a primary URL, the affected field or record, and evidence
  that another reader can reproduce.
- Material corrections receive a new version instead of silently replacing a
  published release.

## How to cite

Use the `CITATION.cff` or BibTeX file inside the version directory for the
dataset you used. Suggested citations:

> RADIHALT Research. (2026). *RADIHALT EMF Evidence Source Index* (Version
> 2026-09-22) [Data set]. Zenodo. https://doi.org/10.5281/zenodo.22908519

> RADIHALT Research. (2026). *RADIHALT Phone SAR Dataset* (Version 2026-04-27)
> [Data set]. Zenodo. https://doi.org/10.5281/zenodo.22908624

## License

RADIHALT's original dataset arrangement, metadata, and documentation in this
repository are available under the
[Creative Commons Attribution 4.0 International License](https://creativecommons.org/licenses/by/4.0/).
See [`LICENSE.md`](LICENSE.md). Referenced third-party publications and source
materials remain subject to their own terms.

## Maintainer

RADIHALT Research is the editorial desk of RADIHALT. The datasets are provided
for transparent research and educational reuse; they are not medical advice.

- Research and media resources: https://radihalt.com/media
- Editorial standards: https://radihalt.com/editorial-policy
- Corrections and verification: support@radihalt.com
