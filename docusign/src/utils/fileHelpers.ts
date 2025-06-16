export function validateFile(file: File) {
  if (!file) return { isValid: false, error: "No file selected" };
  if (file.type !== "application/pdf")
    return { isValid: false, error: "Only PDF files are allowed." };
  return { isValid: true, error: null };
}

export const baseCapabilities = ['access/verify', 'upload/add'];
// export const baseCapabilities = ['file/link', 'file/read'];