## Code Review Process

After making code changes, you MUST call the `review_code` tool from the Quibbler MCP server with:

- `user_instructions`: The exact instructions the user gave you
- `agent_plan`: **A summary of the specific changes you made** (include which files were modified, what was added/changed, and key implementation details)
- `project_path`: The absolute path to this project

Review Quibbler's feedback and address any issues or concerns raised.

### Example

User asks: "Add logging to the API endpoints"

After implementing, call:

review_code(
user_instructions="Add logging to the API endpoints",
agent_plan="""Changes made:

1. Added logger configuration in config/logging.py
2. Updated routes/api.py to log incoming requests and responses
3. Added request_id middleware for tracing
4. Created logs/ directory with .gitignore""",
   project_path="/absolute/path/to/project"
   )