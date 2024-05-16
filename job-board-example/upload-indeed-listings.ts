import * as fs from "fs";
import * as readline from "readline";
import * as path from "path";
import { parse } from "csv-parse";
import {
  ChunkApi,
  ChunkData,
  Configuration,
  CreateChunkData,
} from "@devflowinc/trieve-js-ts-client";

// Define the data structure for your CSV data
interface JobData {
  "Job Title": string;
  "Job Description"?: string;
  Location: string;
  City: string;
  State: string;
  Country: string;
  "Zip Code": string;
  "Apply Url": string;
  "Company Name": string;
  "Employer Logo": string;
  Companydescription: string;
  "Employer Location": string;
  "Employer City": string;
  "Employer State": string;
  "Employer Country": string;
  "Employer Zip Code": string;
  "Uniq Id": string;
  "Crawl Timestamp": string;
}

async function parseCSV(filePath: string): Promise<JobData[]> {
  const items: JobData[] = [];

  return new Promise((resolve, reject) => {
    const parser = fs
      .createReadStream(filePath)
      .pipe(parse({ columns: true, trim: true }));

    parser.on("data", (data: JobData) => {
      items.push(data);
    });

    parser.on("end", () => {
      resolve(items);
    });

    parser.on("error", (error) => {
      reject(error);
    });
  });
}

const trieveApiKey = process.env.TRIEVE_API_KEY ?? "";
const trieveDatasetId = process.env.TRIEVE_DATASET_ID ?? "";

const trieveApiConfig = new Configuration({
  apiKey: trieveApiKey,
  basePath: "https://api.trieve.ai",
});

const chunkApi = new ChunkApi(trieveApiConfig);

// Function to transform JobData to a searchable string
function jobToSearchableString(job: JobData): string {
  let searchableString = "";

  // Safely adds a field to the searchable string if it exists
  const addField = (
    field: string | undefined,
    prefix: string = "",
    postfix: string = "\n\n",
  ) => {
    if (field) {
      searchableString += `${prefix}${field}${postfix}`;
    }
  };

  // Process each field with a safe check and appropriate formatting
  addField(job["Job Title"], "Job Title: ");
  addField(job["Job Description"], "Job Description: ");
  addField(job["Location"], "Location: ");
  addField(job["City"], "City: ");
  addField(job["State"], "State: ");
  addField(job["Country"], "Country: ");
  addField(job["Company Name"], "Company Name: ");
  addField(job["Companydescription"], "Company Description: ");
  addField(job["Employer Location"], "Employer Location: ");
  addField(job["Employer City"], "Employer City: ");
  addField(job["Employer State"], "Employer State: ");
  addField(job["Employer Country"], "Employer Country: ");

  return searchableString.trim();
}

// Function to extract metadata from JobData
function extractMetadata(job: JobData): any {
  delete job["Job Description"];
  return { ...job };
}

async function processJobData(filePath: string) {
  const items = await parseCSV(filePath);

  const createChunkData: CreateChunkData = items.map((item) => ({
    chunk_html: jobToSearchableString(item),
    link: item["Apply Url"] ?? "",
    tracking_id: item["Uniq Id"] ?? "",
    tag_set: [
      item["Employer City"] ?? "",
      item["Employer State"] ?? "",
      item["Employer Country"] ?? "",
    ],
    metadata: extractMetadata(item),
    time_stamp: new Date(item["Crawl Timestamp"]).toISOString() ?? null,
    upsert_by_tracking_id: true,
  }));

  const chunkSize = 50;
  const chunkedItems: CreateChunkData[] = [];
  for (let i = 0; i < createChunkData.length; i += chunkSize) {
    const chunk = createChunkData.slice(i, i + chunkSize);
    chunkedItems.push(chunk);
  }

  for (const chunk of chunkedItems) {
    try {
      console.log(`Creating chunk `);
      await chunkApi.createChunk(trieveDatasetId, chunk);
    } catch (error) {
      console.error(`Failed to create chunk`);
      console.error(error);
    }
  }

  return items;
}

// Run wget -O jobs.csv https://query.data.world/s/pgpakbonuiwfiltmu443p474knfork?dws=00000
const filePath = "./jobs.csv";

processJobData(filePath)
  .then((items) => {
    console.log(`Processed ${items.length} items`);
  })
  .catch((error) => {
    console.error(`Error processing file:`, error);
  });
