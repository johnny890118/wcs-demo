import Nav from "./nav";

export default function Layout({ children }) {
  return (
    <div>
      <main>
        <Nav />
        <div className="h-[8vh]"></div>
        <div>{children}</div>
      </main>
    </div>
  );
}
