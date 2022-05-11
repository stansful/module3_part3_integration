const getImageMeta = async (file: File): Promise<Metadata> => {
  const { name } = file;
  const fileExtension = name.split('.').pop();

  async function getImageParams(file: File) {
    return new Promise((resolve) => {
      const reader = new FileReader();

      reader.onload = async (e: any) => {
        const image = new Image();
        image.src = e.target.result;
        await image.decode();

        resolve({ width: image.width, height: image.height });
      };
      reader.readAsDataURL(file);
    });
  }

  // @ts-ignore
  const { width, height } = await getImageParams(file);
  // @ts-ignore
  return { width, height, fileSize: file.size, fileExtension };
};
