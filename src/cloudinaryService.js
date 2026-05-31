// Cloudinary free plan — POD photos, vehicle photos, odometer images
const CLOUD_NAME = 'YAHAN_AAPKA_CLOUDINARY_NAME';
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
  return data.secure_url;
};
