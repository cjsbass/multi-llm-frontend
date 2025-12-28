"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Sparkles, History, ChevronLeft, Loader2 } from "lucide-react";

interface LLMResponse {
  model: string;
  response: string;
  error?: string;
  timestamp: number;
}

interface QueryResult {
  query: string;
  responses: LLMResponse[];
  analysis?: string;
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<QueryResult | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setResults(null);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    try {
      const response = await fetch(`${apiUrl}/api/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();
      setResults(data);
      setHistory((prev) => [query, ...prev.slice(0, 19)]);
    } catch (error) {
      console.error("Error querying LLMs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!results) return;

    setAnalyzing(true);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    try {
      const response = await fetch(`${apiUrl}/api/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: results.query,
          responses: results.responses
        }),
      });

      const data = await response.json();
      setResults((prev) => prev ? { ...prev, analysis: data.analysis } : null);
    } catch (error) {
      console.error("Error analyzing responses:", error);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="flex h-screen bg-black text-white">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "w-64" : "w-0"
        } transition-all duration-300 border-r border-gray-800 flex flex-col`}
      >
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            <span className="font-semibold">MultiLLM</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="hover:bg-gray-800 p-1 rounded"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        <ScrollArea className="flex-1 px-4">
          <div className="space-y-2">
            <div className="text-sm text-gray-400 font-semibold mb-2 flex items-center gap-2">
              <History className="w-4 h-4" />
              History
            </div>
            {history.map((item, i) => (
              <button
                key={i}
                onClick={() => setQuery(item)}
                className="w-full text-left text-sm p-2 rounded hover:bg-gray-800 truncate"
              >
                {item}
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="absolute top-4 left-4 hover:bg-gray-800 p-2 rounded"
          >
            <ChevronLeft className="w-5 h-5 rotate-180" />
          </button>
        )}

        {!results ? (
          // Initial Search View
          <div className="flex-1 flex flex-col items-center justify-center px-4">
            <h1 className="text-6xl font-bold mb-4">
              SuperGrok <span className="text-gray-500 text-2xl font-normal">HEAVY</span>
            </h1>

            <form onSubmit={handleSubmit} className="w-full max-w-3xl mt-8">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="What do you want to know?"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full h-14 text-lg bg-gray-900 border-gray-700 focus:border-gray-500 pl-12"
                  disabled={loading}
                />
                <Search className="absolute left-4 top-4 w-6 h-6 text-gray-400" />
              </div>

              <div className="flex gap-4 mt-6 justify-center flex-wrap">
                <Button
                  type="button"
                  variant="outline"
                  className="border-gray-700 hover:bg-gray-800"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Deep Search
                </Button>
              </div>
            </form>

            {loading && (
              <div className="mt-8 flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-gray-400">Querying all models...</span>
              </div>
            )}
          </div>
        ) : (
          // Results View
          <ScrollArea className="flex-1">
            <div className="max-w-6xl mx-auto p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold mb-2">{results.query}</h2>
                <Button
                  onClick={() => {
                    setResults(null);
                    setQuery("");
                  }}
                  variant="ghost"
                  size="sm"
                >
                  New Search
                </Button>
              </div>

              {/* Analysis Section */}
              {results.analysis ? (
                <Card className="mb-6 bg-gradient-to-br from-purple-900/20 to-blue-900/20 border-purple-500/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5" />
                      AI Analysis
                    </CardTitle>
                    <CardDescription>
                      Comprehensive analysis of all responses
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="whitespace-pre-wrap">{results.analysis}</div>
                  </CardContent>
                </Card>
              ) : (
                <Button
                  onClick={handleAnalyze}
                  disabled={analyzing}
                  className="mb-6"
                  size="lg"
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Analyze All Responses
                    </>
                  )}
                </Button>
              )}

              {/* Responses Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {results.responses.map((result, i) => (
                  <Card
                    key={i}
                    className={`bg-gray-900 border-gray-700 ${
                      result.error ? "border-red-500/50" : ""
                    }`}
                  >
                    <CardHeader>
                      <CardTitle className="text-lg">{result.model}</CardTitle>
                      <CardDescription className="text-xs">
                        {new Date(result.timestamp).toLocaleTimeString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {result.error ? (
                        <div className="text-red-400 text-sm">
                          Error: {result.error}
                        </div>
                      ) : (
                        <div className="text-gray-300 whitespace-pre-wrap text-sm">
                          {result.response}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
