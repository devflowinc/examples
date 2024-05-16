# Amazon Berkeley Objects

An example of using Trieve with the Amazon Amazon Berkeley Objects dataset.

https://amazon-berkeley-objects.s3.amazonaws.com/index.html

### CSV METADATA

```sh
wget https://amazon-berkeley-objects.s3.amazonaws.com/archives/abo-listings.tar
tar xvf abo-listings.tar
gzip -d listings/metadata/listings_*.json.gz
```

This should extract multiple lines that have 


### Image CSV Data

```sh
wget https://amazon-berkeley-objects.s3.amazonaws.com/images/metadata/images.csv.gz
gzip -d images.csv.gz
```

The `images.csv` is formatted as the following.

```csv
image_id,height,width,path
010-mllS7JL,106,106,14/14fe8812.jpg
01dkn0Gyx0L,122,122,da/daab0cad.jpg
01sUPg0387L,111,111,d2/d2daaae9.jpg
```

Install dependencies:

```bash
bun install
```

To run

Set .env

```sh
TRIEVE_API_KEY="tr-**********************" # Your Trieve API key
TRIEVE_DATASET_ID="*********-************-************" # Your Dataset ID
```

Upload documents to Trieve

```bash
bun run index.ts
```
