import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';

interface ShellProps {
  children: React.ReactNode;
  title?: string;
}

export function Shell({ children, title }: ShellProps) {
  return (
    <>
      <Sidebar />
      <TopNav title={title} />
      <main className="app-main">
        {children}
      </main>
    </>
  );
}
