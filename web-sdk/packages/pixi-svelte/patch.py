import re

with open('src/lib/components/index.ts', 'r', encoding='utf-8') as f:
    content = f.read()

if 'import type { ComponentProps }' not in content:
    content = "import type { ComponentProps } from 'svelte';\n" + content

pattern = r"import\s+(\w+)\s*,\s*\{\s*type\s+Props\s+as\s+(\w+)\s*\}\s*from\s*'([^']+)'\s*;"
replacement = r"import \1 from '\3';\ntype \2 = ComponentProps<typeof \1>;"
content = re.sub(pattern, replacement, content)

with open('src/lib/components/index.ts', 'w', encoding='utf-8') as f:
    f.write(content)
