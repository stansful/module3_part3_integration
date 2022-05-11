## Description

1. The main goal - is to create gallery with auth page on frontend.
2. Practise with js and manipulate with dom elements

## Folder Structure:

```
.
├── src
│    ├── constansts.ts        -| include all constants
│    ├── interfaces.ts        -| include all custom interfaces
│    ├── auth_service.ts      -| main logic of the index.html
│    ├── gallery_service.ts   -| main logic of the gallery.html
│    ├── http_service.ts      -| include get and post request functions
│    ├── page_service.ts      -| add/get current page number to the local storage and set query params
│    └── token_service.ts     -| add/get token and expiresTime to the local storage
├── css
│    └── styles.css       -| styles for html
├── index.html            -| auth page
├── gallery.html          -| gallery page
├── .eslintignore         -| ignore files for eslint
├── .eslintrc.json        -| lint configs
├── .gitignore            -| ignore files for git
├── .prettierignore       -| ignore files for prettier
├── .prettierrc           -| prettier configs
├── package.json          -| project configs dependencies and etc
├── tsconfig.json         -| ts configs
└── README.md
```

## Getting started

1. Install dependencies

```
npm install 
```

2. Compile project

```
npm run build
```

3. Open index.html using IDE to avoid CORS errors

* in VS Code you need to
  install [this plugin](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer)
* in IntelliJ - enable by default

## Other commands:

* format code with prettier

```
npm run format
```

* lint and fix with eslint

```
npm run lint
```

## Issues

If you find any [issue](https://github.com/stansful/module3_part2_dynamo/issues), please submit it.

## Stay in touch

* Author - [Gak Filipp](https://t.me/stansful)