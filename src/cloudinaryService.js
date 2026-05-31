const CLOUD_NAME = 'dh7uziz5u';
const UPLOAD_PRESET = 'deliverflow_uploads';

export const uploadImage = async (file, folder = 'pod') => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', `deliverflow/${folder}`);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  );

  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  return data.secure_url;
};

export const deleteImage = async (publicId) => {
  // Delete handled from backend if needed
  console.log('Image public ID:', publicId);
};
