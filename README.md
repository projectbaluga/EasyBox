# QuickVoucher

**Hotspot Voucher Generator** for MikroTik-based hotspot systems.

Generate, customize, and print WiFi access vouchers with MikroTik-compatible scripts.

## Features

- Generate vouchers with customizable prefix, length, and character types
- User-only or User + Password authentication modes
- Configurable duration, validity, and data limits
- Export as `.rsc` script file (MikroTik-ready)
- Copy script to clipboard
- Print physical voucher cards with optional QR codes
- Custom currency, tag colors, and branding

## Quick Start

Open `index.html` in any browser to start generating vouchers.

## Hotspot Portal Integration

You can embed QuickVoucher directly into your MikroTik hotspot portal:

1. Download the `hotspot/` folder contents
2. Copy `vcgen.html` and `genfolder/` into your MikroTik hotspot directory
3. Access via `http://<hotspot-ip>/vcgen.html`

## Usage

1. Fill in your **Tag Name**, **Prefix**, and voucher settings
2. Set **Duration** and optional **Validity** / **Data Package**
3. Configure your **Hotspot Server** and **IP**
4. Click **Generate Vouchers**
5. **Copy**, **Download .rsc**, or **Print** your vouchers

## License

Open source. Free to use and modify.
