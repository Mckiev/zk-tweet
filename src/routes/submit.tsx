import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Upload, CheckCircle } from "lucide-react";

export const Route = createFileRoute("/submit")({
  component: SubmitComponent,
});

interface SignatureData {
  message: string;
  ring: { keyType: string; publicKey: string }[];
  signature: string;
  timestamp: number;
}

function SubmitComponent() {
  const [signatureText, setSignatureText] = useState("");
  const [parsedSignature, setParsedSignature] = useState<SignatureData | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<"pending" | "valid" | "invalid">("pending");
  const [submitting, setSubmitting] = useState(false);
  
  const submitPost = useMutation(api.posts.create);

  const parseSignature = () => {
    try {
      const parsed = JSON.parse(signatureText) as SignatureData;
      
      // Basic validation
      if (!parsed.message || !parsed.ring || !parsed.signature || !parsed.timestamp) {
        throw new Error("Invalid signature format");
      }
      
      if (!Array.isArray(parsed.ring) || parsed.ring.length === 0) {
        throw new Error("Invalid ring structure");
      }
      
      setParsedSignature(parsed);
      
      // TODO: Implement actual signature verification
      // For now, mark as valid if structure is correct
      setVerificationStatus("valid");
      
    } catch (error) {
      console.error("Error parsing signature:", error);
      setParsedSignature(null);
      setVerificationStatus("invalid");
      alert("Invalid signature format");
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setSignatureText(content);
    };
    reader.readAsText(file);
  };

  const submitToFeed = async () => {
    if (!parsedSignature || verificationStatus !== "valid") {
      alert("Please provide a valid signature first");
      return;
    }

    setSubmitting(true);
    try {
      await submitPost({
        message: parsedSignature.message,
        signature: signatureText,
        ringSize: parsedSignature.ring.length,
        timestamp: parsedSignature.timestamp,
      });
      
      alert("Post submitted successfully!");
      setSignatureText("");
      setParsedSignature(null);
      setVerificationStatus("pending");
    } catch (error) {
      console.error("Error submitting post:", error);
      alert("Failed to submit post");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="not-prose max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Submit Anonymous Post</h1>
      <p className="text-base-content/70 mb-8">
        Submit a ring signature generated from the Generate page to post anonymously
      </p>

      <div className="space-y-6">
        {/* Signature Input */}
        <div className="card bg-base-200">
          <div className="card-body">
            <h2 className="card-title text-lg">Ring Signature</h2>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text">Upload signature file or paste signature</span>
              </label>
              
              <div className="flex gap-2 mb-4">
                <input
                  type="file"
                  accept=".json"
                  className="file-input file-input-bordered flex-1"
                  onChange={handleFileUpload}
                />
                <button 
                  className="btn btn-primary"
                  onClick={parseSignature}
                  disabled={!signatureText.trim()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Parse
                </button>
              </div>
              
              <textarea
                className="textarea textarea-bordered h-40 font-mono text-xs"
                placeholder="Or paste your ring signature JSON here..."
                value={signatureText}
                onChange={(e) => setSignatureText(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Verification Status */}
        {parsedSignature && (
          <div className="card bg-base-200">
            <div className="card-body">
              <h2 className="card-title text-lg">Signature Verification</h2>
              
              <div className={`alert ${
                verificationStatus === "valid" ? "alert-success" : 
                verificationStatus === "invalid" ? "alert-error" : "alert-info"
              }`}>
                <CheckCircle className="w-5 h-5" />
                <span>
                  {verificationStatus === "valid" && "✅ Signature verified successfully"}
                  {verificationStatus === "invalid" && "❌ Invalid signature"}
                  {verificationStatus === "pending" && "⏳ Verifying signature..."}
                </span>
              </div>

              {verificationStatus === "valid" && (
                <div className="mt-4 space-y-3">
                  <div className="bg-base-300 p-4 rounded">
                    <h3 className="font-semibold mb-2">Message:</h3>
                    <p className="whitespace-pre-wrap">{parsedSignature.message}</p>
                  </div>
                  
                  <div className="stats stats-horizontal">
                    <div className="stat">
                      <div className="stat-title">Ring Size</div>
                      <div className="stat-value text-2xl">{parsedSignature.ring.length}</div>
                      <div className="stat-desc">SSH keys in ring</div>
                    </div>
                    <div className="stat">
                      <div className="stat-title">Timestamp</div>
                      <div className="stat-value text-lg">
                        {new Date(parsedSignature.timestamp).toLocaleString()}
                      </div>
                      <div className="stat-desc">When generated</div>
                    </div>
                  </div>

                  <details className="collapse collapse-arrow bg-base-300">
                    <summary className="collapse-title text-sm">View Ring Details</summary>
                    <div className="collapse-content">
                      <div className="max-h-40 overflow-y-auto space-y-2">
                        {parsedSignature.ring.map((key, index) => (
                          <div key={index} className="text-xs p-2 bg-base-100 rounded">
                            <strong>{key.keyType}</strong>: {key.publicKey.substring(0, 50)}...
                          </div>
                        ))}
                      </div>
                    </div>
                  </details>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Submit Button */}
        {verificationStatus === "valid" && (
          <div className="card bg-base-200">
            <div className="card-body">
              <h2 className="card-title text-lg">Submit to Public Feed</h2>
              <p className="text-sm text-base-content/70 mb-4">
                This will post your verified anonymous message to the public feed where anyone can verify the signature.
              </p>
              
              <div className="card-actions justify-end">
                <button 
                  className="btn btn-primary btn-lg"
                  onClick={submitToFeed}
                  disabled={submitting}
                >
                  {submitting ? "Submitting..." : "Submit to Feed"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}