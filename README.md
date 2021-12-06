# Convert text to handwritten pages using Cloudinary and Next.js

## Introduction

You've probably seen some of those images where the text looks like it was handwritten then scanned into an image. In this tutorial, let's explore a fun little trick to achieve the same using [handwritten.js](https://github.com/alias-rahil/handwritten.js/), [cloudinary](https://cloudinary.com/?ap=em) and [next.js](https://nextjs.org/).

[Cloudinary](https://cloudinary.com/?ap=em) provides APIs that offer media upload and storage, optimization, manipulation and delivery. 

## Prerequisites and setup

Knowledge of javascript is required for this tutorial. In addition, you are required to at least have basic knowledge or React.js and Node.js. You also need to have Node.js and NPM installed on your development environment.

We begin by creating a new project. [Next.js](https://nextjs.org/) has a handy CLI tool that scaffolds a basic project for us. Run the following command.

```bash
npx create-next-app text-to-handwritten-page
```

`text-to-handwritten-page` is our project name. Feel free to use any suitable name here. Once the CLI is done scaffolding the project, change directory into your new project and open it in your favorite code editor.

### Dependencies

For this short tutorial we'll be using the following libraries/packages

- [cloudinary](https://www.npmjs.com/package/cloudinary)
- [handwritten.js](https://www.npmjs.com/package/handwritten.js)

Run the following command to install the two

```bash
npm install cloudinary handwritten.js
```

### Cloudinary API Keys

In case you don't have a cloudinary account yet, you can easily get started with a free tier account. You'll be allocated a number of credits for use. Use them carefully and sparingly since you'll probably be charged when they run out. Open up [cloudinary](https://cloudinary.com/?ap=em), create an account if you don't have one and log in. Head over to the [console page](https://cloudinary.com/console?ap=em). Here, you'll find your **cloud name**, **api key** and **api secret**. 

![Cloudinary Dashboard](https://github.com/newtonmunene99/text-to-handwritten-page/blob/master/public/images/cloudinary-dashboard.png "Cloudinary Dashboard")

In your code editor with your project open, create a new file named `.local.env` at the root of your project. Paste the following inside.

```env
CLOUD_NAME=YOUR_CLOUD_NAME
API_KEY=YOUR_API_KEY
API_SECRET=YOUR_API_SECRET
```

Replace `YOUR_CLOUD_NAME` `YOUR_API_KEY` and `YOUR_API_SECRET` in the `.env.local` file with the values that we just got from the [console page](https://cloudinary.com/console?ap=em).

We've just defined those values as environment variables. Luckily, Next.js has built in support for environment variables. Read all about that and advanced options in the [documentation](https://nextjs.org/docs/basic-features/environment-variables)

## Getting started

Let's first write the code we need to communicate with cloudinary. Create a new folder at the root of your project and name it `lib`. We'll store our shared code inside this folder. Create a new file called `cloudinary.js` inside the `lib` folder and paste the following code inside.

```js
// lib/cloudinary.js 

// Import the v2 api and rename it to cloudinary
import { v2 as cloudinary, TransformationOptions } from "cloudinary";

// Initialize the sdk with cloud_name, api_key and api_secret
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

const CLOUDINARY_FOLDER_NAME = "text-to-handwriting/";

/**
 * Gets a resource from cloudinary using it's public id
 *
 * @param {string} publicId The public id of the image
 */
export const handleGetCloudinaryResource = (publicId) => {
  return cloudinary.api.resource(publicId, {
    resource_type: "image",
    type: "upload",
  });
};

/**
 * Get cloudinary uploads
 * @returns {Promise}
 */
export const handleGetCloudinaryUploads = () => {
  return cloudinary.api.resources({
    type: "upload",
    prefix: CLOUDINARY_FOLDER_NAME,
    resource_type: "image",
  });
};

/**
 * Uploads an image to cloudinary and returns the upload result
 *
 * @param {{file: string | Buffer; publicId?: string; folder?: boolean; }} resource
 */
export const handleCloudinaryUpload = (resource) => {
  return cloudinary.uploader.upload(resource.file, {
    // Folder to store image in
    folder: resource.folder ? CLOUDINARY_FOLDER_NAME : null,
    // Public id of image.
    public_id: resource.publicId,
    // Type of resource
    resource_type: "auto",
  });
};

/**
 * Deletes resources from cloudinary. Takes in an array of public ids
 * @param {string[]} ids
 */
export const handleCloudinaryDelete = (ids) => {
  return cloudinary.api.delete_resources(ids, {
    resource_type: "image",
  });
};
```

Let's go over what's happening here. At the very top, we import the `v2` API from the cloudinary SDK and rename it to `cloudinary`. The next thing we do is to call the `config` method on the SDK to initialize it. To this we pass the `cloud_name`, `api_key`, and `api_secret`. We defined this as environment variables earlier. Just after that we define a folder where all our images are going to be stored. Storing all our images in one folder makes it easier to fetch all uploaded images. In a real world application you would probably want to store the link in a database or something. Since this is just a tutorial without user authentication or anything of the sort, just fetching all uploaded images works just fine. 

The `handleGetCloudinaryResource`, `handleCloudinaryUpload` and `handleCloudinaryDelete` methods just call the [get resources](https://cloudinary.com/documentation/admin_api#get_resources), [upload](https://cloudinary.com/documentation/image_upload_api_reference#upload_method) and [delete](https://cloudinary.com/documentation/admin_api#delete_resources) APIs respectively.

`handleGetCloudinaryResource` will call the `api.resources` method on the SDK to fetch all images uploaded to our folder.

`handleCloudinaryUpload` will call the `uploader.upload` method on the SDK to upload a resource. It takes in a resource object containing `file` which can either be a base64 string, path, or buffer. The object may also contain `publicId` if you don't want cloudinary to provide a random id for you.

---

Next, create a new folder called `images` under `pages/api/`. Create a new file called `index.js` under `pages/api/images`. This file will handle calls to the `/api/images` endpoint. API routes are a core part of Next.js. If you're not familiar, I recommend you have a read through [this documentation](https://nextjs.org/docs/api-routes/introduction). Paste the following code inside `pages/api/images/index.js`

```js
// pages/api/images/index.js

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

```

The structure of a Next.js API route is very simple. You just need to have a default export that is a function. The function can take in the incoming request object and the outgoing response object. In the code above, we use a switch statement so that we can only handle GET and POST requests. When a GET request is made to the `/api/images` endpoint, we want to fetch all uploaded resources. This is handled by the `handleGetRequest` function. When a POST request is made to the `/api/images` endpoint, we want to create and upload an image. This is handled by the `handlePostRequest` function.

`handlePostRequest` takes in the incoming request body. We use object destructuring to get the text, color of the text, and whether the page should be ruled or not. We then import the handwritten library at the top and use it to convert the text into an image of a handwritten page. You can read more about the options passed to `handwritten()` from the [github docs](https://github.com/alias-rahil/handwritten.js/#in-code). The [docs](https://github.com/alias-rahil/handwritten.js/#:~:text=If%20the%20output%20type%20is%20set%20to%20pdf%2C%20it%20returns%20a%20promise%20that%20will%20resolve%20in%20a%20pdfkit%20document%20instance.%20Else%20it%20will%20return%20a%20promise%20that%20will%20resolve%20in%20an%20array%20containing%20the%20buffer%20or%20base64%20value%20of%20the%20images%20according%20to%20the%20output%20type%20provided) also state that, when the output type is pdf we get an instance of [PDFKit](https://github.com/foliojs/pdfkit#readme), however, when it's an image, we get an array containing either the base64 string or Buffer array. We proceed to use array destructuring to get the base64 string. We then upload that to cloudinary using the `handleCloudinaryUpload` method. 

Create a new file called `[...id].js` inside `pages/api/images` folder. This file will handle api requests made to the `/api/images/:id` endpoint. Paste the following code inside

```js
import { NextApiRequest, NextApiResponse } from "next";
import { handleCloudinaryDelete } from "../../../lib/cloudinary";

/**
 *
 * @param {NextApiRequest} req
 * @param {NextApiResponse} res
 */
export default async function handler(req, res) {
  let { id } = req.query;

  if (!id) {
    res.status(400).json({ error: "Missing id" });
    return;
  }

  if (Array.isArray(id)) {
    id = id.join("/");
  }

  switch (req.method) {
    case "DELETE": {
      try {
        const result = await handleDeleteRequest(id);

        return res.status(200).json({ message: "Success", result });
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

const handleDeleteRequest = async (id) => {
  const result = await handleCloudinaryDelete([id]);

  return result;
};

```

This is very similar to `pages/api/images/index.js` only that this time we're only handling DELETE requests. You'll also notice the weird file name. This is all part of Next.js API routes. When we have dynamic routes such as `/api/images/:id` we can handle them by using the syntax `[id].js` to name the file that will be handling the route. Okay, so what about the syntax we used for this file? Sometimes, you want to catch all other routes following your dynamic part. For example `/api/images/:id/:anotherId`. To catch all routes after the `:id` you want to use `[...id].js`. Read [this documentation](https://nextjs.org/docs/api-routes/dynamic-api-routes#catch-all-api-routes) to get a better explanation.

---

Moving on to the frontend. Add the following code inside `styles/globals.css`.

```css

:root {
  --color-primary: #0070f3;
}

.btn {
  background-color: var(--color-primary);
  border-radius: 5px;
  border: none;
  color: #fff;
  text-transform: uppercase;
  padding: 1rem;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 50px;
}

.danger {
  background-color: #cc0000;
}

.btn:hover:not([disabled]) {
  filter: brightness(90%);
  box-shadow: 0px 5px 15px rgba(0, 0, 0, 0.2);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

```

These are just a few styles to help us with the UI.

Create a new folder at the root of your project and name it `components`. This folder will hold shared components. Create a new file inside and name it `Layout.js` and paste the following code inside.

```jsx
// components/Layout.js

import Head from "next/head";
import Link from "next/link";

export default function Layout({ children }) {
  return (
    <div>
      <Head>
        <title>Text to handwritten page</title>
        <meta name="description" content="Text to handwritten page" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <nav>
        <ul>
          <li>
            <Link href="/">
              <a className="btn">Home</a>
            </Link>
          </li>
          <li>
            <Link href="/images">
              <a className="btn">Images</a>
            </Link>
          </li>
        </ul>
      </nav>
      <main>{children}</main>
      <style jsx>{`
        nav {
          height: 100px;
          background-color: #f4f4f4;
        }

        nav ul {
          height: 100%;
          width: 100%;
          list-style: none;
          margin: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 10px;
        }

        main {
          min-height: calc(100vh - 100px);
        }
      `}</style>
    </div>
  );
}

```

We'll use this component to wrap our pages so that we have a consistent layout and also so that we can avoid code duplication.

> TIP: You can give your frontend components the `.jsx` extension for better intellisense and code completion

Paste the following code inside `pages/index.js`.

```jsx
import { useRouter } from "next/router";
import { useState } from "react";
import Layout from "../components/Layout";

export default function Home() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      const formData = new FormData(e.target);

      const response = await fetch("/api/images", {
        method: "POST",
        body: JSON.stringify({
          text: formData.get("text"),
          color: formData.get("color"),
          ruled: formData.get("ruled") === "on",
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw data;
      }

      router.push("/images");
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="wrapper">
        <h1>Convert text to handwritten page photo</h1>
        <form onSubmit={handleFormSubmit}>
          <div className="input-wrapper">
            <label htmlFor="text">Text</label>
            <textarea
              name="text"
              id="text"
              cols="30"
              rows="10"
              placeholder="Input your text here"
              required
            ></textarea>
          </div>
          <div className="input-wrapper inline">
            <label htmlFor="ruled">Ruled Page: </label>
            <input
              type="checkbox"
              name="ruled"
              id="ruled"
              defaultChecked={true}
              disabled={submitting}
            />
          </div>
          <div className="input-wrapper">
            <label htmlFor="color">Text Color</label>
            <select
              name="color"
              id="color"
              defaultValue="black"
              required
              disabled={submitting}
            >
              <option value="black">Black</option>
              <option value="red">Red</option>
              <option value="blue">Blue</option>
            </select>
          </div>
          <button className="btn" type="submit" disabled={submitting}>
            Convert Text
          </button>
        </form>
      </div>
      <style jsx>{`
        .wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        form {
          width: 60%;
          max-width: 600px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          border-radius: 5px;
          background-color: #fafafa;
          box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
        }

        form .input-wrapper {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        form .input-wrapper.inline {
          flex-direction: row;
          justify-content: flex-start;
          align-items: center;
        }

        form .input-wrapper label {
          font-size: 14px;
        }

        form .input-wrapper textarea,
        form .input-wrapper select,
        form .input-wrapper input {
          border: none;
          outline: none;
          border-radius: 5px;
          padding: 5px;
          min-height: 50px;
        }

        form .input-wrapper input[type="checkbox"] {
          height: 20px;
          width: 20px;
        }

        form .input-wrapper textarea:focus {
          outline: 2px solid var(--color-primary);
        }
      `}</style>
    </Layout>
  );
}

```

This page contains a form that will trigger the `handleFormSubmit` method on submission. `handleFormSubmit` posts the data to the `/api/images` endpoint that we created earlier then on success it navigates to the `/images` page that we're going to create next.

Create a new file inside `pages/` folder and call it `images.js`. Paste the following code inside `pages/images.js`.

```jsx
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Layout from "../components/Layout";

export default function Images() {
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState([]);

  const getImages = useCallback(async () => {
    try {
      setLoading(true);

      const response = await fetch("/api/images", {
        method: "GET",
      });

      const data = await response.json();

      if (!response.ok) {
        throw data;
      }

      setImages(data.result.resources);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    getImages();
  }, [getImages]);

  const handleDownloadResource = async (url) => {
    try {
      setLoading(true);

      const response = await fetch(url, {});

      if (response.ok) {
        const blob = await response.blob();

        const fileUrl = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = fileUrl;
        a.download = `my-virtual-tag.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        return;
      }

      throw await response.json();
    } catch (error) {
      // TODO: Show error message to user
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setLoading(true);

      const response = await fetch(`/api/images/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw data;
      }

      getImages();
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      {images.length > 0 ? (
        <div className="wrapper">
          <div className="images-wrapper">
            {images.map((image) => {
              return (
                <div className="image-wrapper" key={image.public_id}>
                  <div className="image">
                    <Image
                      src={image.secure_url}
                      width={image.width}
                      height={image.height}
                      layout="responsive"
                      alt={image.secure_url}
                    ></Image>
                  </div>
                  <div className="actions">
                    <button
                      className="btn"
                      disabled={loading}
                      onClick={() => {
                        handleDownloadResource(image.secure_url);
                      }}
                    >
                      Download
                    </button>
                    <button
                      className="btn danger"
                      disabled={loading}
                      onClick={() => {
                        handleDelete(image.public_id);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
      {!loading && images.length === 0 ? (
        <div className="no-images">
          <b>No Images Yet</b>
          <Link href="/">
            <a className="btn">Convert some text</a>
          </Link>
        </div>
      ) : null}
      {loading && images.length === 0 ? (
        <div className="loading">
          <b>Loading...</b>
        </div>
      ) : null}
      <style jsx>{`
        div.wrapper {
          min-height: 100vh;
          background-color: #f4f4f4;
        }

        div.wrapper div.images-wrapper {
          display: flex;
          flex-flow: row wrap;
          gap: 10px;
          padding: 10px;
        }

        div.wrapper div.images-wrapper div.image-wrapper {
          flex: 0 0 400px;
          display: flex;
          flex-flow: column;
        }

        div.wrapper div.images-wrapper div.image-wrapper div.image {
          background-color: #ffffff;
          position: relative;
          width: 100%;
        }

        div.wrapper div.images-wrapper div.image-wrapper div.actions {
          background-color: #ffffff;
          padding: 10px;
          display: flex;
          flex-flow: row wrap;
          gap: 10px;
        }

        div.loading,
        div.no-images {
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-flow: column;
          gap: 10px;
        }
      `}</style>
    </Layout>
  );
}
```

This page will display all our images. The page uses the `useEffect` and `useCallback` react hooks to make a get request to the `/api/images` endpoint. I won't get into react hooks since there's a lot of resources on them online. A good place to start is the [React hooks API reference](https://reactjs.org/docs/hooks-reference.html). `handleDelete` takes in an image's public id and makes a DELETE request to the `/api/images/:id` endpoint.

One more thing we need to do. We need to configure Next.js to be able to display images from cloudinary using the [Next.js Image component](https://nextjs.org/docs/api-reference/next/image). We're going to be adding the cloudinary domain to `next.config.js`. Read more about this [here](https://nextjs.org/docs/api-reference/next/image#domains). Insert the following code inside `next.config.js`.

```js
module.exports = {
  // ... other options
  images: {
    domains: ["res.cloudinary.com"],
  },
};

```

If you can't find the `next.config.js` file at the root of your project, you can create it yourself.

That is it for this short tutorial. You can now run your application on the development environment using the following command.

```bash
npm run dev
```

See the Next.js documentation for information on how to build for other environments and also how to optimize your code. It's worth mentioning that this is a very simple implementation and is in no way intended to be applied to a production environment. There's lot's of ways you can optimize our implementation for a fast production environment.

Congrats for making it to the end. You can find the full source code on my [Github](https://github.com/musebe/Text-handwriting)

