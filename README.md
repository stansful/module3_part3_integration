## Description

- The main goal is to remove MongoDB and use DynamoDB

## Quick start:

1. Install dependencies for both backend & frontend

```
npm run dependencies 
```

2. Configure serverless
   credentials. [More Info here](https://www.serverless.com/framework/docs/providers/aws/guide/credentials)

```
serverless config credentials \
  --provider aws \
  --key AKIAIOSFODNN7EXAMPLE \
  --secret wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

3. Create kms_key.yml in backend directory, add following:

```
local: kms-super-secret-key
dev: kms-super-secret-key
```

4. Deploy project:

```
npm run deploy
```

5. Copy HttpApiUrl from console to the: frontend/src/constants.ts
   Constant name is:

```
API_URL
```

6. Build frontend using command:

```
npm run build
```

7. Open index.html file from frontend folder

## Issues

If you find any [issue](https://github.com/stansful/module3_part2_dynamo/issues), please submit it.

## Stay in touch

* api Author - [Gak Filipp](https://t.me/stansful)