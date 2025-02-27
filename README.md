# nrepo

nrepo is a web-based tool designed to prepare and combine source code for LLMs. It streamlines the process of processing multiple source files into an optimized text format, making it easier to work with code in LLM contexts.This is also my personal fork of [dropnread](https://dropnread.io/) project to prepare source code for LLMs. 

## Usage

Using nrepo is straightforward:

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

## Privacy

nrepo processes all files locally in your browser, ensuring your source code remains private and secure.


## License

This project is licensed under the [MIT](LICENCE) License.



