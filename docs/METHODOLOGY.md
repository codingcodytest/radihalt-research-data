# Methodology and provenance

This document describes how RADIHALT Research assembles, reviews, and versions
the datasets in this repository.

## Shared release controls

Every published version is expected to meet these checks:

- CSV and JSON contain the same number of records.
- Record identifiers are unique and stable within the dataset.
- Required fields are present and values use the documented units.
- Public source and RADIHALT guide URLs use HTTPS.
- Limitations, provenance, license, and a suggested citation are visible.
- Release files receive SHA-256 integrity hashes.
- Material data changes create a new version and changelog entry.

The public Git history is an audit trail. It does not replace independent
verification of an underlying source.

## EMF Evidence Source Index

### Purpose

The index is a discovery tool for comparing the evidence cultures that shape
EMF guidance and public discussion. It intentionally includes multiple roles:

- mainstream regulators and international guidance bodies;
- national standards and stricter jurisdictional policies;
- precautionary resolutions and frameworks;
- research programs and classifications;
- physician guidance; and
- peer-reviewed studies directly relevant to shielding or exposure evidence.

### Selection and fields

A record is selected when it contributes a distinct, useful primary reference
or evidence role. Each record includes:

- a stable RADIHALT identifier;
- source name and geographic or institutional origin;
- publication year;
- RADIHALT's editorial source-role classification and label;
- the original citation or reference;
- a primary or authoritative source URL; and
- a permanent RADIHALT guide URL.

### Limitations

The index is curated, not systematic. It does not claim complete literature
coverage, quantify study quality, pool effect sizes, or imply that included
sources agree. Source-role labels are RADIHALT editorial classifications. A
source's inclusion is not an endorsement of every conclusion it contains.

## Phone SAR Dataset

### Purpose

The dataset makes a selected group of U.S. phone SAR records easy to compare
and cite. It covers Apple, Samsung, and Google models released from 2020
through 2024.

### Provenance and fields

The snapshot was compiled from published RF Safe phone summaries and keyed to
the FCC IDs included in the dataset. Records should be confirmed in the
[FCC OET Equipment Authorization Database](https://www.fcc.gov/oet/ea/fccid)
before they are used for technical, legal, or safety decisions.

Each record includes:

- stable slug;
- brand and model;
- release year;
- head SAR in W/kg;
- body SAR in W/kg;
- FCC ID; and
- a permanent RADIHALT detail-page URL.

### Interpretation limits

SAR is a maximum-power compliance test, not a prediction of typical daily
exposure or a health-risk score. Real-world exposure varies with signal
strength, distance, antenna behavior, device configuration, and use. FCC and
ICNIRP values use different averaging methods and should not be compared
one-to-one. The dataset is not an exhaustive live catalog of phones currently
sold.

## Product Identity and Technical Specification Dataset

### Purpose

The dataset provides a stable, machine-readable first-party reference for the
four current RADIHALT Faraday / EMF shielding blanket and mat variants. It is
designed to reduce ambiguity from copied or conflicting marketplace text and
make each current size and color directly traceable to its identifiers and
technical specification.

### Provenance and fields

Variant identity is reconciled across RADIHALT's signed supplier declaration,
first-party product records, and digitally verified UPC/GTIN artwork. The
current material composition and care specification reflects the supplier's
July 26, 2026 clarification and the final production-label wording reviewed
for this release.

Each record includes:

- stable record identifier and variant label;
- ASIN, original Amazon seller SKU, UPC/GTIN-12, and GTIN-13;
- nominal width, length, and color;
- country of origin, construction, product type, and power status;
- current material composition and care specification;
- evidence status and specification effective date; and
- a product URL and last-reviewed date.

The shared current-production specification identifies the outer textile and
binding as 100% cotton and the inner Faraday fabric as 60% polyester, 32%
copper, and 8% nickel. These fields are supplier-confirmed specifications and
are labeled as such in the release.

The JSON release also carries its Zenodo DOI and version-specific repository
URL so a downloaded copy remains directly identifiable and traceable without
requiring the repository manifest.

### Verification boundaries

Digital UPC/GTIN artwork was decoded and checked for valid check digits. A
folded-and-sewn physical production-label sample was still pending at the
version date. Material composition has not been independently verified by
chemical, fibre-content, conductivity, or nickel-release testing. This dataset
does not report attenuation, signal-isolation, medical, health-outcome, or
comparative-performance results; those require separate evidence and test
methods.

## Corrections and review

Correction reports are evaluated against primary, authoritative, or applicable
first-party product evidence.
When high-quality sources conflict, the conflict and scope are documented
instead of forcing a false consensus. Accepted material corrections create a
new version so prior citations remain reproducible.

Questions and private verification material may be sent to
support@radihalt.com. Publicly reproducible corrections should use the GitHub
issue forms so the evidence trail remains visible.
