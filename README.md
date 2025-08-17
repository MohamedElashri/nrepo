# nrepo

`nrepo` is a web-based tool designed to prepare and combine source code for LLMs. It streamlines the process of processing multiple source files into an optimized text format, making it easier to work with code in LLM contexts. This is also my personal fork of [dropnread](https://dropnread.io/) project to prepare source code for LLMs. 

## Try it 

I host an instance of `nrepo` at [nrepo](https://melashri.com/nrepo). It is hosted on Github Pages and is being built from the main  branch of this repository.


## Usage

Using `nrepo` is straightforward:

1. Select your target LLM model and its token limit
2. Choose whether to strip comments from code files
3. Configure ignore patterns or use existing `.gitignore` rules
4. Drag and drop your files/folders or use the file selector
5. Review the processed output and copy to clipboard

There is also GitHub integration to automatically clone repositories and process them with the same options as above.

## Output Format

The tool provides customizable output formatting with variables like:
- {path} - File path
- {filename} - File name
- {content} - File content
- {newline} - New line character

## Models
I usually put the latest models or the models that I personally use or aware of so it is not exhaustive.

For simplicity, I assume 1 token ~ 3.5 English characters (including spaces and punctuation), this is a conservative average rather than a hard rule, since tokenization varies by model, text, and encoding.

## Privacy

`nrepo` processes all files locally in your browser, ensuring your source code remains private and secure.


## License

This project is licensed under the [MIT](LICENCE) License.



