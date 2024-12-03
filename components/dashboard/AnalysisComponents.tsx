"use client";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SecurityAnalysisResults } from "./SecurityAnalysisResults";
import { getCookie } from "@/app/(dashboard)/dashboard/main/page";
import router from "next/router";
import SaveButtonComponent from "@/components/dashboard/SaveButtonComponent"; // Import SaveButtonComponent


export const NewAnalysis = () => {
  const [url, setUrl] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [results, setResults] = React.useState<any>(null);
  const [saveStatus, setSaveStatus] = React.useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState<boolean>(false); // Track if the scan has been saved
  const [isSaving, setIsSaving] = useState<boolean>(false); // Track if the scan has been saved
  const mongoose = require("mongoose");

  useEffect(() => {
    // Get the userId from the cookie
    const userId = getCookie("userId");
    if (userId !== null) {
      setUserId(userId as unknown as string); // Set the userId in state
    } else {
      // Redirect to login if the userId is not found
      //router.push("/login");
    }
    console.log(userId);
  }, [router]);

  const handleAnalysis = async () => {
    setIsLoading(true);
    setResults(null);
    setSaveStatus(null); // Clear previous save status

    try {
      const response = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("API Response:", data); // Log API response
        setResults(data);
      } else {
        console.error("Failed to fetch analysis results");
      }
    } catch (error) {
      console.error("Error analyzing URL:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewReports = () => {
    if (typeof window !== "undefined") {
      router.push("/dashboard/reports");
    }
  };

  const handleSaveScan = async () => {
    setIsSaving(true);
    if (!results) {
      setSaveStatus("No results to save.");
      return;
    }

    setSaveStatus(null); // Clear previous save status
    console.log("Saving scan with userId:", userId); // Log the URL being saved
    try {
      const response = await fetch("/api/storeScan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId, // Replace with the actual user ID from session or context
          url: JSON.stringify({ url }),
          scanResults: results,
        }),
      });

      const data = await response.json();
      if (response.status === 201) {
        setSaveStatus(`Scan saved successfully`);
        setIsSaving(false); // Set isSaving to false to hide the save button
        setIsSaved(true); // Set isSaved to true to hide the save button
      } else {
        setSaveStatus(`Failed to save scan: ${data.error}`);
      }
    } catch (error) {
      console.error("Error saving scan:", error);
      setSaveStatus("Failed to save scan.");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>New Security Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-4">
            <Input
              placeholder="Enter target URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleAnalysis} disabled={!url || isLoading}>
              {isLoading ? "Analyzing..." : "Start Fuzzing"}
            </Button>
          </div>

          {results && (
            <div className="mt-6">
              <SecurityAnalysisResults results={results} />
              <SaveButtonComponent handleClicked={handleSaveScan} isSaved={isSaved} isSaving={isSaving}/>
              {saveStatus && (
                <div className="mt-2 text-sm">
                  <span>{saveStatus}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export const ResultsDisplay = ({ results }: { results: any }) => {
  console.log("Results Data:", results); // Log results for debugging

  return <SecurityAnalysisResults results={results} />;
};
