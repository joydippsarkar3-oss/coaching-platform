import { getBlogPosts } from "@/lib/api";
import { buildMetadata } from "@/lib/metadata";
import type { Metadata } from "next";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { Clock, User } from "lucide-react";

export const metadata: Metadata = buildMetadata({
  title: "Learning Hub",
  description:
    "Tips, guides and career advice for computer and vocational training students in India.",
  path: "/blog",
});

export default async function BlogIndexPage() {
  const posts = await getBlogPosts({ limit: 20 });

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
          Learning Hub
        </h1>
        <p className="mt-2 text-gray-600">
          Tips, guides and career advice for IT and vocational students
        </p>
      </div>

      {posts.length === 0 ? (
        <p className="text-gray-500">No articles yet — check back soon.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow"
            >
              {post.coverImageUrl ? (
                <img
                  src={post.coverImageUrl}
                  alt={post.title}
                  className="aspect-video w-full object-cover"
                />
              ) : (
                <div className="aspect-video w-full bg-brand-50 flex items-center justify-center text-brand-300 text-sm">
                  [Cover image]
                </div>
              )}
              <div className="flex flex-1 flex-col p-5">
                <div className="mb-2">
                  <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700">
                    {post.category}
                  </span>
                </div>
                <h2 className="text-base font-semibold text-gray-900 group-hover:text-brand-600 leading-snug flex-1">
                  {post.title}
                </h2>
                <p className="mt-2 text-sm text-gray-600 line-clamp-2 leading-relaxed">
                  {post.excerpt}
                </p>
                <div className="mt-4 flex items-center gap-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <User className="size-3.5" /> {post.authorName}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="size-3.5" /> {post.readingTimeMinutes} min read
                  </span>
                  <span className="ml-auto">{formatDate(post.publishedAt)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
