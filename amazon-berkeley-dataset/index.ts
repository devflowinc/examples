import { readdir } from "node:fs/promises";
import { resolve } from "path";
import * as readline from "readline";
import { createReadStream } from "fs";

// Define the chunk structure
interface Chunk {
  chunk_html: string;
  link: string;
  tracking_id: string;
  tag_set: string[];
  metadata: Partial<Item>;
  upsert_by_tracking_id: boolean;
  image_urls?: string[];
}

interface LanguageTaggedValue {
  language_tag: string;
  value: string;
}

interface ItemDimension {
  unit: string;
  value: number;
}

interface ItemDimensions {
  height: ItemDimension;
  length: ItemDimension;
  width: ItemDimension;
}

interface Node {
  node_id: number;
  node_name: string;
}

interface Item {
  brand: LanguageTaggedValue[];
  bullet_point: LanguageTaggedValue[];
  color: LanguageTaggedValue[];
  item_id: string;
  price?: number;
  image_url?: string;
  item_name: LanguageTaggedValue[];
  model_name: LanguageTaggedValue[];
  model_number: { value: string }[];
  model_year: { value: number }[];
  product_type: { value: string }[];
  style: LanguageTaggedValue[];
  main_image_id: string;
  other_image_id: string[];
  item_keywords: LanguageTaggedValue[];
  country: string;
  marketplace: string;
  domain_name: string;
  node: Node[];
  item_dimensions?: ItemDimensions;
}

function processLine(line: string) {
  const item: Item = JSON.parse(line);
  let image_url;
  let imageId = item.main_image_id == "" ? null : item.main_image_id;
  let imagePath = imageHashMap.get(imageId);
  let price = [10, 25, 50, 100, 500, 1000][Math.floor(Math.random() * 6)];

  if (imagePath != null) {
    image_url = `https://amazon-berkeley-objects.s3.amazonaws.com/images/small/${imagePath}`;
  }

  let searchableString = "";

  // Safely adds a field to the searchable string if it exists
  const addField = (
    field: string | undefined,
    prefix: string = "",
    postfix: string = "\n"
  ) => {
    if (field) {
      searchableString += `${prefix}${field}${postfix}`;
    }
  };

  addField(price?.toString(), "Price: $");
  // Process each field with a safe check and appropriate formatting
  addField(item.brand?.[0]?.value, "Brand: ");
  addField(item.item_name?.[0]?.value, "Product Name: ");

  item.bullet_point?.forEach((bp) => addField(bp.value, "", ";"));

  addField(item.color?.[0]?.value, "Color: ");
  addField(item.model_name?.[0]?.value, "Model Name: ");
  addField(item.model_number?.[0]?.value, "Model Number: ");

  // For numerical fields, ensure existence before converting to string
  if (item.model_year?.[0]?.value !== undefined) {
    addField(item.model_year[0].value.toString(), "Model Year: ");
  }

  addField(item.product_type?.[0]?.value, "Product Type: ");
  addField(item.style?.[0]?.value, "Style: ");

  item.item_keywords?.forEach((kw) => addField(kw.value, "", ";"));

  addField(item.country, "Country: ");
  addField(item.marketplace, "Marketplace: ");
  addField(item.domain_name, "Domain: ");

  const metadata: Partial<Item> = { ...item };
  metadata.image_url = image_url;
  metadata.price = price;

  const chunkData: Chunk = {
    chunk_html: searchableString.trim(),
    link: `https://${item.domain_name}/dp/${item.item_id}`,
    tracking_id: item.item_id,
    tag_set: item.item_keywords?.map((kw) => kw.value),
    metadata,
    image_urls: [image_url ?? ""],
    upsert_by_tracking_id: true,
  };
  return chunkData;
}

// Function to parse CSV data and store it in a hashmap
function parseCSV(csvData: string): Map<any, any> {
  const lines = csvData.split("\n");
  const hashmap = new Map();

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].trim().split(",");
    let imageId: string | null = null;
    let path: string | null = null;
    if (values[0]) {
      imageId = values[0].trim();
    }
    if (values[3]) {
      path = values[3].trim();
    }

    if (imageId != null && path != null) {
      hashmap.set(imageId, path);
    }
  }
  return hashmap;
}

// Read CSV file
const imageFilePath = "./images.csv";
const csvImageData = await Bun.file(imageFilePath).text();
let imageHashMap = parseCSV(csvImageData);
if (imageHashMap == null) {
  console.log("Failed to load image csv data");
}

const trieveApiKey = Bun.env.TRIEVE_API_KEY ?? "";
const trieveDatasetId = Bun.env.TRIEVE_DATASET_ID ?? "";

const directoryPath = "./listings/metadata/";

const files = await readdir(directoryPath);

for (const file of files) {
  const fullPath = resolve(directoryPath + file);
  const fileStream = createReadStream(fullPath);

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  const items: Chunk[] = [];

  for await (const line of rl) {
    try {
      const chunkData: Chunk = processLine(line);
      items.push(chunkData);
    } catch (error) {
      console.error("Error parsing JSON from line:", error);
    }
  }

  const batchSize = 120;
  const chunkedItems: Chunk[][] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const chunk = items.slice(i, i + batchSize);
    chunkedItems.push(chunk);
  }

  for (const chunk of chunkedItems) {
    try {
      console.log(`Creating chunk`);
      const options = {
        method: "POST",
        headers: {
          "TR-Dataset": trieveDatasetId,
          Authorization: trieveApiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(chunk),
      };

      await fetch("https://api.trieve.ai/api/chunk", options);
    } catch (error) {
      console.error(`Failed to create chunk`);
      console.error(error);
    }
  }
}
