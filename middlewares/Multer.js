import multer from "multer";

export default multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 102481024 }
});