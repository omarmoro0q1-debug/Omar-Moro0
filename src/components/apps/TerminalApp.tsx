/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Shield, Sparkles } from 'lucide-react';
import { FileItem } from '../../types';

interface TerminalAppProps {
  files: FileItem[];
  onCreateFile: (name: string, content: string, type: 'text') => void;
  systemTheme: { accentColor: string };
}

export default function TerminalApp({ files, onCreateFile, systemTheme }: TerminalAppProps) {
  const [history, setHistory] = useState<string[]>([
    'Welcome to Gemileith OS v3.2 [Core-Kernel Secure Shell Terminal]',
    'Type "help" to display list of available diagnostic system commands.',
    'Ready. Dialed system active.',
    ''
  ]);
  const [inputVal, setInputVal] = useState('');
  const [terminalTheme, setTerminalTheme] = useState<'green' | 'amber' | 'cyan'>('green');
  const [isLoading, setIsLoading] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [history]);

  const handleCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim() || isLoading) return;

    const commandStr = inputVal.trim();
    setInputVal('');

    setHistory((prev) => [...prev, `guest@gemileith_os:~$ ${commandStr}`]);

    const parts = commandStr.split(' ');
    const mainCommand = parts[0].toLowerCase();
    const args = parts.slice(1);

    switch (mainCommand) {
      case 'help':
        setHistory((prev) => [
          ...prev,
          'Available Core Diagnostic Commands:',
          '  help                         - Display this help prompt matrix.',
          '  neofetch                     - Fetch system credentials and host specifications.',
          '  ls                           - List cloud/local file directory keys.',
          '  cat <filename.txt>           - Read target filename contents.',
          '  write <filename.txt> "<msg>" - Create/Write text file contents (e.g. write test.txt "hello").',
          '  gemi <prompt>                - Execute terminal inquiry via Gemini Copilot API.',
          '  theme <green|amber|cyan>     - Adjust phosphorus terminal theme.',
          '  clear                        - Clear directory logs buffer.',
          ''
        ]);
        break;

      case 'neofetch':
        const uptimeSeconds = Math.floor(performance.now() / 1000);
        setHistory((prev) => [
          ...prev,
          '       .---.          GEMILEITH OS OPTIMUM 3.2',
          '      /     \\         ------------------------',
          '      \\_.._/          - OS: Gemileith Premium Hyper shell',
          '     /\\\\   //\\        - Kernel: v3.2-Antigravity-Cortex',
          '    | | \\_/ | |       - Uptime: ' + uptimeSeconds + 's',
          '    | |     | |       - Host: Google Cloud Run SandBox',
          '     \\\\     //        - CPU: Dual Intel Xeon SkyLake vCPU',
          '      \'_..._\'         - Memory: 4.2 GiB Allocated',
          '                      - AI Copilot: Gemini 2.x Cortex Engine',
          '                      - Auth Mode: Cloud Sync Enabled',
          '',
          ''
        ]);
        break;

      case 'ls':
        if (files.length === 0) {
          setHistory((prev) => [...prev, 'Empty directories. No files found.', '']);
        } else {
          const lines = files.map((f) => `  -rw-r--r--   guest   staff   ${f.content.length} B   ${f.name}`);
          setHistory((prev) => [...prev, 'Directory total: ' + files.length, ...lines, '']);
        }
        break;

      case 'cat':
        if (args.length === 0) {
          setHistory((prev) => [...prev, 'Error: missing target filename argument. Usage: cat test.txt', '']);
        } else {
          const target = args[0];
          const matched = files.find((f) => f.name.toLowerCase() === target.toLowerCase());
          if (matched) {
            setHistory((prev) => [...prev, `[Reading ${target}]:`, matched.content, '']);
          } else {
            setHistory((prev) => [...prev, `Error: File "${target}" not found.`, '']);
          }
        }
        break;

      case 'write':
        const rawArgs = args.join(' ');
        const firstQuote = rawArgs.indexOf('"');
        const lastQuote = rawArgs.lastIndexOf('"');

        if (firstQuote === -1 || lastQuote === -1 || firstQuote === lastQuote) {
          setHistory((prev) => [
            ...prev,
            'Error: Malformed params. Usage: write test.txt "content here"',
            ''
          ]);
        } else {
          const fileName = rawArgs.substring(0, firstQuote).trim();
          const content = rawArgs.substring(firstQuote + 1, lastQuote);
          if (!fileName) {
            setHistory((prev) => [...prev, 'Error: Empty filename detected.', '']);
          } else {
            onCreateFile(fileName, content, 'text');
            setHistory((prev) => [...prev, `File "${fileName}" saved successfully to filesystem.`, '']);
          }
        }
        break;

      case 'gemi':
        if (args.length === 0) {
          setHistory((prev) => [...prev, 'Error: Please specify query text. Usage: gemi What is CPU speed?', '']);
        } else {
          const prompt = args.join(' ');
          setIsLoading(true);
          setHistory((prev) => [...prev, 'System: Talking to cosmic cloud AI interface Gemi...', '']);

          try {
            const res = await fetch('/api/gemini', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                prompt,
                model: 'gemini-3.5-flash',
              }),
            });

            if (!res.ok) throw new Error('API communication error.');
            const data = await res.json();
            setHistory((prev) => [...prev, `Gemi: ${data.text}`, '']);
          } catch (err) {
            setHistory((prev) => [...prev, 'System Error: Failed to response from API client.', '']);
          } finally {
            setIsLoading(false);
          }
        }
        break;

      case 'theme':
        if (args.length === 0) {
          setHistory((prev) => [...prev, 'Error: Choose theme. Usage: theme green|amber|cyan', '']);
        } else {
          const requested = args[0].toLowerCase();
          if (requested === 'green' || requested === 'amber' || requested === 'cyan') {
            setTerminalTheme(requested as any);
            setHistory((prev) => [...prev, `Terminal phosphorous changed to ${requested}.`, '']);
          } else {
            setHistory((prev) => [...prev, 'Error: Available themes are "green", "amber", or "cyan".', '']);
          }
        }
        break;

      case 'clear':
        setHistory([]);
        break;

      default:
        setHistory((prev) => [
          ...prev,
          `sh: command not recognized: "${mainCommand}". Type "help" for a list of system keys.`,
          ''
        ]);
        break;
    }
  };

  // Theme color maps for phosphorous terminal
  const themeColors = {
    green: {
      text: 'text-emerald-400',
      bg: 'bg-slate-950/95',
      border: 'border-emerald-950',
      caret: 'bg-emerald-400',
      input: 'text-emerald-300',
      heading: 'bg-emerald-950/20 text-emerald-400 border-emerald-900/50'
    },
    amber: {
      text: 'text-amber-400',
      bg: 'bg-stone-950/95',
      border: 'border-amber-950',
      caret: 'bg-amber-400',
      input: 'text-amber-300',
      heading: 'bg-amber-950/20 text-amber-400 border-amber-900/50'
    },
    cyan: {
      text: 'text-cyan-400',
      bg: 'bg-slate-950/95',
      border: 'border-cyan-950',
      caret: 'bg-cyan-400',
      input: 'text-cyan-300',
      heading: 'bg-cyan-950/20 text-cyan-400 border-cyan-00/50'
    }
  };

  const curr = themeColors[terminalTheme];

  return (
    <div className={`flex flex-col h-full font-mono text-xs rounded-xl overflow-hidden shadow-2xl border ${curr.bg} ${curr.border} ${curr.text}`}>
      {/* Shell Header */}
      <div className={`flex items-center justify-between p-2.5 border-b shrink-0 ${curr.heading}`}>
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 animate-pulse" />
          <span className="font-bold tracking-wide">SYSTEM DIAGNOSTIC SHELL (guest@gemileith_os)</span>
        </div>
        <div className="flex items-center gap-2 text-[10px]">
          <Shield className="w-3.5 h-3.5" />
          <span className="font-bold">SECURITY ENFORCED</span>
        </div>
      </div>

      {/* Console logs output */}
      <div ref={containerRef} className="flex-1 p-4 overflow-y-auto space-y-1.5 leading-relaxed font-mono">
        {history.map((line, i) => (
          <div key={i} className="whitespace-pre-wrap select-text">{line}</div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-1.5 animate-pulse text-indigo-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>نظام تشغيل جيميليث: جاري الاتصال المزدوج بالنواة...</span>
          </div>
        )}
      </div>

      {/* Input row prompt */}
      <form onSubmit={handleCommand} className="flex items-center gap-1.5 p-2 bg-black/40 border-t border-dashed border-slate-800">
        <span className="pl-2 shrink-0 select-none">guest@gemileith_os:~$</span>
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          disabled={isLoading}
          placeholder='اكتب Command هنا (مثل help أو neofetch)...'
          className={`flex-1 bg-transparent border-none outline-none font-mono ${curr.input} placeholder:text-stone-700/80`}
        />
      </form>
    </div>
  );
}
