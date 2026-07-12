import pymupdf

doc = pymupdf.open(r'c:\Users\SHABBIR G\Desktop\Hackathon\AssetFlow problem statement.pdfAssetFlow problem statement.pdf')
text = ''.join([page.get_text() for page in doc])
doc.close()

with open(r'c:\Users\SHABBIR G\Desktop\Hackathon\pdf_text.txt', 'w', encoding='utf-8') as f:
    f.write(text)

print("Done. Text extracted to pdf_text.txt")
