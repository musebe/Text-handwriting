import { NextApiRequest, NextApiResponse } from "next";
import handwritten from "handwritten.js";
import COLORS from "handwritten.js/src/constants";
import {
  handleCloudinaryUpload,
  handleGetCloudinaryUploads,
} from "../../../lib/cloudinary";

/**
 * Endpoint handler
 * @param {NextApiRequest} req
 * @param {NextApiResponse} res
 */
export default async function handler(req, res) {
  // Switch based on the request method
  switch (req.method) {
    case "GET": {
      try {
        const result = await handleGetRequest();

        return res.status(200).json({ message: "Success", result });
      } catch (error) {
        console.error(error);
        return res.status(400).json({ message: "Error", error });
      }
    }

    case "POST": {
      try {
        const result = await handlePostRequest(req.body);

        return res.status(201).json({ message: "Success", result });
      } catch (error) {
        console.error(error);
        return res.status(400).json({ message: "Error", error });
      }
    }

    default: {
      return res.status(405).json({ message: "Method not allowed" });
    }
  }
}

const handleGetRequest = async () => {
  // Get all the uploads
  const result = await handleGetCloudinaryUploads();

  return result;
};

const handlePostRequest = async (body) => {
  const { text, color, ruled } = body;

  // Convert text to handwritten image.
  const [base64Image] = await handwritten(text, {
    ruled,
    outputType: "png/b64",
    inkColor: color,
  });

  // Upload the image to cloudinary
  const uploadResponse = await handleCloudinaryUpload({
    file: base64Image,
    folder: true,
  });

  return uploadResponse;
};
