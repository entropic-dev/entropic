# Installing `ds`

Entropic requires a new command-line client, called `ds` (or "entropy delta".) 

## Pre-requisites
- Node 12+

## Manually
Get package from https://www.entropic.dev/ds-latest.tgz and install it with `npm install -g`

## *nix

```sh
curl -sSL https://www.entropic.dev/install.sh | bash
wget -O - https://www.entropic.dev/install.sh | bash
```

### MacOS

```sh
brew install https://raw.githubusercontent.com/entropic-dev/entropic/master/docs/installing/homebrew/ds.rb
```

### Arch Linux

If you're using Arch Linux, install the [`nodejs-entropic`](https://aur.archlinux.org/packages/nodejs-entropic/) package from the AUR.


### Windows

You need some sort of "*nix on windows" to execute install script.

If you have Git or [Windows Subsystem for Linux](https://docs.microsoft.com/en-us/windows/wsl/install-win10) 
installed, download [installation script](https://www.entropic.dev/install.sh) and execute it with a double click. 

There's no standalone MSI installer at the moment.
