import SignalLogo from "@/components/SignalLogo";
import Avatar from "@/components/Avatar";

export default function Loading() {
  return (
    <main className="studio-loading shell" aria-busy="true">
      <header className="brand">
        <SignalLogo />
        <span>YOUR INTERVIEW STUDIO</span>
      </header>
      <section className="loading-presence" role="status">
        <Avatar state="connecting" />
        <p className="eyebrow">A LITTLE SPACE TO THINK</p>
        <h1>Setting the stage.</h1>
        <p>Getting your interview room ready…</p>
      </section>
      <div className="loading-workspace" aria-hidden="true">
        <div />
        <div />
        <div />
      </div>
    </main>
  );
}
