import SerpentBackground from "./components/SerpentBackground";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-white text-black">
      <SerpentBackground />

      <div className="relative z-10 mx-auto max-w-3xl px-6 py-20">
        <h1 className="text-5xl font-semibold tracking-tight">Your Name</h1>
        <p className="mt-4 text-lg opacity-80">
          Dots-in-water background with an invisible moving “serpent”.
        </p>
      </div>
    </main>
  );
}