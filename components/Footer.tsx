export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="section-wrap py-8 text-center text-sm text-slate-500">
        <p>© {new Date().getFullYear()} Private AI Automation. All rights reserved.</p>
      </div>
    </footer>
  );
}
