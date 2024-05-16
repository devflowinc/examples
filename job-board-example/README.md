# Trieve Job Board Demo

This is a demo of [Trieve](https://trieve.ai), a powerful search api that allows you to search over your data.

## Getting Started

To get started with the Trieve Job Board Demo, follow these steps:

1. Clone the repository:

    ```bash
    git clone https://github.com/devflowinc/job-search
    ```

2. Install the required dependencies:

    ```bash
    bun install
    ```

3. Go over to the https://dashboard.trieve.ai and create an account.
4. Create a new dataset and note the dataset id.
5. Create a new API key and note the API key.
6. Create an .env file in the root of the project and add the following environment variables:
    ```bash
    TRIEVE_API_KEY=your-api-key
    TRIEVE_DATASET_ID=your-dataset-id
    ```
7. Download the dataset from [here](https://query.data.world/s/pgpakbonuiwfiltmu443p474knfork?dws=00000) and put it in the root of the project.
8. Run the demo:

    ```bash
    bun upload-indeed-listings.ts
    ```

## Usage

Once all the chunks have been uploaded, you can search for the job listings at https://search.trieve.ai, and selecting the dataset you uploaded your data to.

## Features

The Trieve Job Board Demo includes the following features:

- Search for job listings on Indeed.
- Filter job listings based on various criteria.
- View detailed information about each job listing.

## Contributing

Contributions are welcome! If you'd like to contribute to the Trieve Job Board Demo, please follow these guidelines:

1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Make your changes and commit them.
4. Push your changes to your forked repository.
5. Submit a pull request.

## License

This project is licensed under the [MIT License](LICENSE).
