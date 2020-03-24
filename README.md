# effective-winner-mumble
## Setup for Local Testing (Non RPi Device - Hardware Simulation/No Audio)
1. Install Nodejs 10 (Checkout https://github.com/nvm-sh/nvm). `nvm install 10`. (Node 12 is incompatable with mumble package)
2. Install build tools: `sudo apt-get install build-essential`
3. run `npm i`
4. run `./scripts/gen-cert.sh`
5. Copy `.env.template` to `.env` and configure as desired
6. run `npm start`
## Setup for Local Raspberry Pi with Hardware and Audio
1. Install Nodejs 10
2. Install build tools: `sudo apt-get install build-essential`
3. run `npm i`
0.  run `npm run pi-i`: Installs pacakges needed for hardware and audio
4. run `./scripts/gen-cert.sh`
5. Copy `.env.template` to `.env` and configure as desired
6. run `npm start`
## Other Requirements
1. `sudo apt-get install usbmount` for USB Automount

## Troubleshooting
### Error: Could not locate the bindings file
  Something is wrong with the installed node_modules. Run `rm -R node_modules && npm i` to rebuid the node_modules
