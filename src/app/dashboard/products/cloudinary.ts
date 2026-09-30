import axios from 'axios';

export const uploadImageToCloudinary = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'stock_manager'); // Replace with your Cloudinary upload preset

  try {
    const response = await axios.post('https://api.cloudinary.com/v1_1/du0vsc2pt/image/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.secure_url;
  } catch (error) {
    console.error('Error uploading image to Cloudinary:', error);
    throw error;
  }
};