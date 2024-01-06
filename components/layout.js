import Nav from "./nav";

export default function Layout({ children }) {
  return (
    <div>
      <main>
        <Nav />
        <div>{children}</div>
      </main>
    </div>
  );
}
