import { notFound } from "next/navigation";
import { getBlogPost } from "@/lib/api";
import { SchemaOrg } from "@/components/shared/SchemaOrg";
import { buildArticleSchema, buildBreadcrumbSchema } from "@/lib/schema-org";
import { buildBlogMetadata } from "@/lib/metadata";
import { formatDate } from "@/lib/utils";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Clock, User, Calendar } from "lucide-react";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) return {};
  return buildBlogMetadata({
    title: post.title,
    excerpt: post.excerpt,
    slug: post.slug,
    coverImage: post.coverImageUrl,
  });
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) notFound();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.example.com";

  const articleSchema = buildArticleSchema({
    headline: post.title,
    description: post.excerpt,
    url: `${siteUrl}/blog/${post.slug}`,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    authorName: post.authorName,
    image: post.coverImageUrl,
  });

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "Home", url: siteUrl },
    { name: "Blog", url: `${siteUrl}/blog` },
    { name: post.title, url: `${siteUrl}/blog/${post.slug}` },
  ]);

  return (
    <>
      <SchemaOrg data={[articleSchema, breadcrumbSchema]} />

      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Back */}
        <Link
          href="/blog"
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-600"
        >
          <ArrowLeft className="size-4" /> Back to Blog
        </Link>

        {/* Category */}
        <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
          {post.category}
        </span>

        {/* Title */}
        <h1 className="mt-4 text-3xl font-extrabold text-gray-900 leading-tight sm:text-4xl">
          {post.title}
        </h1>

        {/* Meta */}
        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-500">
          <span className="flex items-center gap-1.5">
            <User className="size-4" /> {post.authorName}
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar className="size-4" /> {formatDate(post.publishedAt)}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="size-4" /> {post.readingTimeMinutes} min read
          </span>
        </div>

        {/* Cover image */}
        {post.coverImageUrl && (
          <img
            src={post.coverImageUrl}
            alt={post.title}
            className="mt-8 aspect-video w-full rounded-xl object-cover"
          />
        )}

        {/* Content */}
        <div
          className="prose prose-gray prose-headings:font-bold prose-a:text-brand-600 mt-10 max-w-none"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="mt-10 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </article>
    </>
  );
}
