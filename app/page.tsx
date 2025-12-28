"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Sparkles, History, ChevronLeft, Loader2, MapPin } from "lucide-react";

interface LLMResponse {
  model: string;
  response: string;
  error?: string;
  timestamp: number;
  loading?: boolean;
}

interface QueryResult {
  query: string;
  responses: LLMResponse[];
  analysis?: string;
}

interface Location {
  city?: string;
  country?: string;
  latitude: number;
  longitude: number;
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<QueryResult | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [location, setLocation] = useState<Location | null>(null);
  const [locationPermission, setLocationPermission] = useState<string>("prompt");

  // Request location permission on mount
  useEffect(() => {
    requestLocation();
  }, []);

  const requestLocation = async () => {
    if (!navigator.geolocation) {
      console.log("Geolocation not supported");
      return;
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      const { latitude, longitude } = position.coords;

      // Reverse geocode to get city/country
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
        );
        const data = await response.json();

        setLocation({
          latitude,
          longitude,
          city: data.address?.city || data.address?.town || data.address?.village,
          country: data.address?.country,
        });
        setLocationPermission("granted");
      } catch (error) {
        console.error("Error reverse geocoding:", error);
        setLocation({ latitude, longitude });
        setLocationPermission("granted");
      }
    } catch (error) {
      console.error("Error getting location:", error);
      setLocationPermission("denied");
    }
  };

  const shouldAddLocation = (query: string): boolean => {
    const locationKeywords = ['weather', 'temperature', 'forecast', 'near me', 'nearby', 'local', 'around here'];
    return locationKeywords.some(keyword => query.toLowerCase().includes(keyword));
  };

  const enhanceQueryWithLocation = (query: string): string => {
    if (!location || !shouldAddLocation(query)) return query;

    const locationString = location.city && location.country
      ? `in ${location.city}, ${location.country}`
      : `at coordinates ${location.latitude.toFixed(2)}, ${location.longitude.toFixed(2)}`;

    return `${query} ${locationString}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    const enhancedQuery = enhanceQueryWithLocation(query);

    // Initialize results with loading states for all 4 models
    const initialResponses: LLMResponse[] = [
      { model: "GPT-5.2 Thinking (OpenAI) - Dec 2025", response: "", loading: true, timestamp: Date.now() },
      { model: "Grok 4.1 Thinking (xAI) - Dec 2025", response: "", loading: true, timestamp: Date.now() },
      { model: "Claude Opus 4.5 (Anthropic) - Dec 2025", response: "", loading: true, timestamp: Date.now() },
      { model: "Gemini 3 Pro (Google) - Dec 2025", response: "", loading: true, timestamp: Date.now() },
    ];

    setResults({
      query: enhancedQuery,
      responses: initialResponses,
    });
    setHistory((prev) => [query, ...prev.slice(0, 19)]);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    // Query each model individually in parallel for real-time updates
    const modelEndpoints = [
      { endpoint: "/api/query-individual/gpt", index: 0 },
      { endpoint: "/api/query-individual/grok", index: 1 },
      { endpoint: "/api/query-individual/claude", index: 2 },
      { endpoint: "/api/query-individual/gemini", index: 3 },
    ];

    // Start all queries in parallel
    const promises = modelEndpoints.map(async ({ endpoint, index }) => {
      try {
        const response = await fetch(`${apiUrl}${endpoint}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: enhancedQuery }),
        });

        const data = await response.json();

        // Update this specific model's response immediately
        setResults(prev => {
          if (!prev) return prev;
          const newResponses = [...prev.responses];
          newResponses[index] = { ...data, loading: false };
          return { ...prev, responses: newResponses };
        });
      } catch (error) {
        console.error(`Error querying model ${index}:`, error);
        setResults(prev => {
          if (!prev) return prev;
          const newResponses = [...prev.responses];
          newResponses[index] = {
            ...newResponses[index],
            loading: false,
            error: "Failed to fetch response"
          };
          return { ...prev, responses: newResponses };
        });
      }
    });

    // Wait for all to complete
    await Promise.all(promises);
    setLoading(false);
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
            <span className="font-semibold">CorrieLLM</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="hover:bg-gray-800 p-1 rounded"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Location Status */}
        {location && (
          <div className="px-4 py-2 border-t border-b border-gray-800 text-xs text-gray-400 flex items-center gap-2">
            <MapPin className="w-3 h-3" />
            <span>
              {location.city ? `${location.city}, ${location.country}` : "Location detected"}
            </span>
          </div>
        )}

        <ScrollArea className="flex-1 px-4">
          <div className="space-y-2">
            <div className="text-xs font-semibold text-gray-400 mb-2 flex items-center gap-2">
              <History className="w-4 h-4" />
              Recent
            </div>
            {history.map((item, index) => (
              <button
                key={index}
                onClick={() => setQuery(item)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-800 rounded-lg transition-colors text-gray-300 truncate"
              >
                {item}
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-800 p-4 flex items-center gap-4">
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="hover:bg-gray-800 p-2 rounded"
            >
              <Search className="w-5 h-5" />
            </button>
          )}
          <form onSubmit={handleSubmit} className="flex-1 flex gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={location ? "Ask anything... (location auto-detected)" : "Ask anything..."}
              className="flex-1 bg-gray-900 border-gray-700 focus:border-blue-500"
              disabled={loading}
            />
            <Button type="submit" disabled={loading || !query.trim()}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {loading ? "Querying..." : "Query All"}
            </Button>
          </form>
        </div>

        {/* Results */}
        <ScrollArea className="flex-1 p-6">
          {results && (
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">{results.query}</h2>
                {results.responses.every(r => !r.loading) && (
                  <Button
                    onClick={handleAnalyze}
                    disabled={analyzing}
                    variant="outline"
                    className="border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.responses.map((response, index) => (
                  <Card
                    key={index}
                    className={`bg-gray-900 border-gray-800 ${
                      response.loading ? "animate-pulse" : ""
                    }`}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{response.model}</CardTitle>
                        {response.loading && (
                          <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                        )}
                      </div>
                      {!response.loading && (
                        <CardDescription>
                          {new Date(response.timestamp).toLocaleTimeString()}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      {response.loading ? (
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-800 rounded w-3/4"></div>
                          <div className="h-4 bg-gray-800 rounded w-full"></div>
                          <div className="h-4 bg-gray-800 rounded w-5/6"></div>
                        </div>
                      ) : response.error ? (
                        <div className="text-red-400 text-sm">{response.error}</div>
                      ) : (
                        <div className="text-sm text-gray-300 whitespace-pre-wrap">
                          {response.response}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {results.analysis && (
                <Card className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-blue-500/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5" />
                      AI Analysis by Claude Opus 4.5
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-gray-300 whitespace-pre-wrap">
                      {results.analysis}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {!results && !loading && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Sparkles className="w-16 h-16 mb-4 text-gray-600" />
              <h1 className="text-4xl font-bold mb-2">CorrieLLM</h1>
              <p className="text-gray-400 mb-4">
                Query 4 frontier AI models simultaneously and compare their responses
              </p>
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
                <div>✓ GPT-5.2 Thinking</div>
                <div>✓ Grok 4.1 Thinking</div>
                <div>✓ Claude Opus 4.5</div>
                <div>✓ Gemini 3 Pro</div>
              </div>
              {location && (
                <div className="mt-4 text-xs text-green-400 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Location-based queries enabled
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
