#!/bin/bash
# Run this script from inside your frontend/ folder
# It replaces every wrong image path with the correct one in all HTML files

FILES=(
  "individual-risks.html"
  "transport-insurance.html"
  "technical-risks.html"
  "industrial-risks.html"
  "company.html"
  "company-careers.html"
  "contact.html"
  "news.html"
  "products.html"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    # Fix both /resources/img/ and resources/img/ → img/
    sed -i 's|/resources/img/|img/|g' "$file"
    sed -i 's|resources/img/|img/|g' "$file"
    echo "✅ Fixed: $file"
  else
    echo "⚠️  Not found: $file"
  fi
done

echo ""
echo "Done. All image paths updated to img/"