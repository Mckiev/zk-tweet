import { createFileRoute } from "@tanstack/router";
import { useState } from "react";
import { Octokit } from "@octokit/rest";
import { Download } from "lucide-react";

export const Route = createFileRoute("/generate")({
  component: GenerateComponent,
});

interface SSHKey {
  id: number;
  key: string;
  keyType: string;
  user: string;
}

function GenerateComponent() {
  const [githubUrl, setGithubUrl] = useState("");
  const [message, setMessage] = useState("");
  const [sshKeys, setSshKeys] = useState<SSHKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [signature, setSignature] = useState("");
  const [privateKey, setPrivateKey] = useState("");

  const parseGithubUrl = (url: string) => {
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (match) {
      return { owner: match[1], repo: match[2] };
    }
    
    const orgMatch = url.match(/github\.com\/([^\/]+)$/);
    if (orgMatch) {
      return { owner: orgMatch[1], repo: null };
    }
    
    return null;
  };

  const fetchSSHKeys = async () => {
    if (!githubUrl.trim()) return;
    
    setLoading(true);
    try {
      const octokit = new Octokit();
      const parsed = parseGithubUrl(githubUrl);
      
      if (!parsed) {
        throw new Error("Invalid GitHub URL");
      }

      let keys: SSHKey[] = [];
      
      if (parsed.repo) {
        // Fetch contributors' SSH keys
        const { data: contributors } = await octokit.repos.listContributors({
          owner: parsed.owner,
          repo: parsed.repo,
        });
        
        for (const contributor of contributors.slice(0, 20)) { // Limit to first 20
          try {
            const { data: userKeys } = await octokit.users.listPublicKeysForUser({
              username: contributor.login,
            });
            
            keys.push(...userKeys.map(key => ({
              id: key.id,
              key: key.key,
              keyType: key.key.split(' ')[0],
              user: contributor.login,
            })));
          } catch (error) {
            console.warn(`Failed to fetch keys for ${contributor.login}:`, error);
          }
        }
      } else {
        // Fetch organization members' SSH keys
        try {
          const { data: members } = await octokit.orgs.listMembers({
            org: parsed.owner,
          });
          
          for (const member of members.slice(0, 20)) { // Limit to first 20
            try {
              const { data: userKeys } = await octokit.users.listPublicKeysForUser({
                username: member.login,
              });
              
              keys.push(...userKeys.map(key => ({
                id: key.id,
                key: key.key,
                keyType: key.key.split(' ')[0],
                user: member.login,
              })));
            } catch (error) {
              console.warn(`Failed to fetch keys for ${member.login}:`, error);
            }
          }
        } catch (error) {
          console.warn("Failed to fetch org members, trying public repos");
          
          // Fallback: fetch recent contributors from public repos
          const { data: repos } = await octokit.repos.listForOrg({
            org: parsed.owner,
            sort: "updated",
            per_page: 5,
          });
          
          for (const repo of repos) {
            try {
              const { data: contributors } = await octokit.repos.listContributors({
                owner: parsed.owner,
                repo: repo.name,
              });
              
              for (const contributor of contributors.slice(0, 10)) {
                try {
                  const { data: userKeys } = await octokit.users.listPublicKeysForUser({
                    username: contributor.login,
                  });
                  
                  keys.push(...userKeys.map(key => ({
                    id: key.id,
                    key: key.key,
                    keyType: key.key.split(' ')[0],
                    user: contributor.login,
                  })));
                } catch (error) {
                  console.warn(`Failed to fetch keys for ${contributor.login}:`, error);
                }
              }
            } catch (error) {
              console.warn(`Failed to fetch contributors for ${repo.name}:`, error);
            }
          }
        }
      }
      
      // Remove duplicates
      const uniqueKeys = keys.filter((key, index, self) => 
        index === self.findIndex(k => k.key === key.key)
      );
      
      setSshKeys(uniqueKeys);
    } catch (error) {
      console.error("Error fetching SSH keys:", error);
      alert("Failed to fetch SSH keys. Make sure the GitHub URL is correct and the repo/org is public.");
    } finally {
      setLoading(false);
    }
  };

  const generateSignature = async () => {
    if (!message.trim() || !privateKey.trim() || sshKeys.length === 0) {
      alert("Please provide a message, private key, and ensure SSH keys are loaded");
      return;
    }

    try {
      // For now, create a placeholder signature format
      // TODO: Implement actual ring signature generation
      const signatureData = {
        message,
        ring: sshKeys.map(key => ({ keyType: key.keyType, publicKey: key.key.split(' ')[1] })),
        signature: `placeholder_ring_signature_${Date.now()}`,
        timestamp: Date.now(),
      };
      
      setSignature(JSON.stringify(signatureData, null, 2));
    } catch (error) {
      console.error("Error generating signature:", error);
      alert("Failed to generate signature");
    }
  };

  const downloadSignature = () => {
    if (!signature) return;
    
    const blob = new Blob([signature], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ring-signature.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="not-prose max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Generate Ring Signature</h1>
      <p className="text-base-content/70 mb-8">
        Generate an anonymous signature proving membership in a GitHub repository or organization
      </p>

      <div className="space-y-6">
        {/* GitHub URL Input */}
        <div className="card bg-base-200">
          <div className="card-body">
            <h2 className="card-title text-lg">Step 1: GitHub Repository or Organization</h2>
            <div className="form-control">
              <label className="label">
                <span className="label-text">GitHub URL</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://github.com/owner/repo or https://github.com/org"
                  className="input input-bordered flex-1"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                />
                <button 
                  className="btn btn-primary"
                  onClick={fetchSSHKeys}
                  disabled={loading}
                >
                  {loading ? "Loading..." : "Fetch Keys"}
                </button>
              </div>
            </div>
            
            {sshKeys.length > 0 && (
              <div className="mt-4">
                <div className="alert alert-success">
                  <span>Found {sshKeys.length} SSH keys from {new Set(sshKeys.map(k => k.user)).size} users</span>
                </div>
                <details className="collapse collapse-arrow mt-2">
                  <summary className="collapse-title text-sm">View SSH Keys</summary>
                  <div className="collapse-content">
                    <div className="max-h-40 overflow-y-auto">
                      {sshKeys.map((key, index) => (
                        <div key={index} className="text-xs p-2 bg-base-300 rounded mb-1">
                          <strong>{key.user}</strong> ({key.keyType}): {key.key.substring(0, 50)}...
                        </div>
                      ))}
                    </div>
                  </div>
                </details>
              </div>
            )}
          </div>
        </div>

        {/* Private Key Input */}
        <div className="card bg-base-200">
          <div className="card-body">
            <h2 className="card-title text-lg">Step 2: Your Private SSH Key</h2>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Private Key (stays local)</span>
              </label>
              <textarea
                className="textarea textarea-bordered h-32"
                placeholder="-----BEGIN OPENSSH PRIVATE KEY-----
...your private key content...
-----END OPENSSH PRIVATE KEY-----"
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
              />
              <label className="label">
                <span className="label-text-alt text-warning">⚠️ Your private key never leaves this page</span>
              </label>
            </div>
          </div>
        </div>

        {/* Message Input */}
        <div className="card bg-base-200">
          <div className="card-body">
            <h2 className="card-title text-lg">Step 3: Message to Sign</h2>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Message</span>
              </label>
              <textarea
                className="textarea textarea-bordered h-24"
                placeholder="Enter your anonymous message here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
            
            <div className="card-actions justify-end mt-4">
              <button 
                className="btn btn-primary"
                onClick={generateSignature}
                disabled={!message.trim() || !privateKey.trim() || sshKeys.length === 0}
              >
                Generate Ring Signature
              </button>
            </div>
          </div>
        </div>

        {/* Generated Signature */}
        {signature && (
          <div className="card bg-base-200">
            <div className="card-body">
              <h2 className="card-title text-lg">Generated Signature</h2>
              <div className="form-control">
                <textarea
                  className="textarea textarea-bordered h-40 font-mono text-xs"
                  value={signature}
                  readOnly
                />
              </div>
              <div className="card-actions justify-end">
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={() => navigator.clipboard.writeText(signature)}
                >
                  Copy to Clipboard
                </button>
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={downloadSignature}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}