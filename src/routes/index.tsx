import { SignInButton } from "@clerk/clerk-react";
import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Authenticated, Unauthenticated } from "convex/react";
import { ShieldCheck, Clock, Users, CheckCircle, X } from "lucide-react";
import { api } from "../../convex/_generated/api";

const postsQueryOptions = convexQuery(api.posts.list, {});

export const Route = createFileRoute("/")({
  loader: async ({ context: { queryClient } }) =>
    await queryClient.ensureQueryData(postsQueryOptions),
  component: HomePage,
});

function HomePage() {
  return (
    <div>
      <Unauthenticated>
        <div className="text-center mb-8">
          <div className="not-prose flex justify-center mb-4">
            <ShieldCheck className="w-16 h-16 text-primary" />
          </div>
          <h1>ZK-Tweet</h1>
          <p className="text-lg text-base-content/70 mb-6">
            Anonymous whistleblowing platform using zero-knowledge proofs
          </p>
          <div className="not-prose">
            <SignInButton mode="modal">
              <button className="btn btn-primary btn-lg">Get Started</button>
            </SignInButton>
          </div>
        </div>
      </Unauthenticated>

      <Authenticated>
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Anonymous Feed</h1>
          <p className="text-base-content/70 mb-4">
            Verified anonymous posts from GitHub organization members
          </p>
          <div className="not-prose flex gap-2">
            <Link to="/generate" className="btn btn-primary">
              Generate Signature
            </Link>
            <Link to="/submit" className="btn btn-secondary">
              Submit Post
            </Link>
          </div>
        </div>
        <PostsFeed />
      </Authenticated>
    </div>
  );
}

function PostsFeed() {
  const { data: posts } = useSuspenseQuery(postsQueryOptions);

  if (posts.length === 0) {
    return (
      <div className="not-prose">
        <div className="p-8 bg-base-200 rounded-lg text-center">
          <ShieldCheck className="w-12 h-12 text-base-content/30 mx-auto mb-4" />
          <p className="opacity-70 mb-4">No posts yet. Be the first to share anonymously!</p>
          <Link to="/generate" className="btn btn-primary">
            Create First Post
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="not-prose space-y-4">
      {posts.map((post) => (
        <div key={post._id} className="card bg-base-200">
          <div className="card-body">
            <div className="flex items-start gap-3">
              <div className="avatar placeholder">
                <div className="bg-neutral text-neutral-content rounded-full w-10">
                  <span className="text-xs">?</span>
                </div>
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold">Anonymous</span>
                  {post.verified ? (
                    <div className="badge badge-success badge-sm gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Verified
                    </div>
                  ) : (
                    <div className="badge badge-error badge-sm gap-1">
                      <X className="w-3 h-3" />
                      Unverified
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-sm text-base-content/60">
                    <Clock className="w-3 h-3" />
                    {new Date(post.timestamp).toLocaleString()}
                  </div>
                </div>
                
                <div className="mb-3">
                  <p className="whitespace-pre-wrap">{post.message}</p>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-base-content/60">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    Ring size: {post.ringSize}
                  </div>
                  
                  <details className="dropdown">
                    <summary className="btn btn-xs btn-ghost">View Signature</summary>
                    <div className="dropdown-content z-10 w-96 p-4 bg-base-300 rounded-lg border border-base-content/20">
                      <div className="text-xs font-mono break-all max-h-40 overflow-y-auto">
                        {post.signature}
                      </div>
                      <div className="mt-2">
                        <button 
                          className="btn btn-xs btn-primary"
                          onClick={() => navigator.clipboard.writeText(post.signature)}
                        >
                          Copy Signature
                        </button>
                      </div>
                    </div>
                  </details>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}