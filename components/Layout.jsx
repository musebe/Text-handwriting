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
