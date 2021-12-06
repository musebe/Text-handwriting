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
