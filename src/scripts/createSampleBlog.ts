import 'dotenv/config';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { BlogPost } from '../db/models/BlogPost.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-hunt';

const samplePosts = [
  {
    title: "The Future of AI: GPT-4 and Beyond",
    slug: "the-future-of-ai-gpt4-and-beyond",
    excerpt: "<p>Explore the groundbreaking capabilities of GPT-4 and what it means for the future of artificial intelligence. We'll dive deep into its potential impact on various industries.</p>",
    content: `<h1>The Future of AI: GPT-4 and Beyond</h1>
    <p>As we stand on the cusp of a new era in artificial intelligence, GPT-4 represents a quantum leap in natural language processing and understanding. This article explores its capabilities and implications.</p>
    <h2>Revolutionary Capabilities</h2>
    <p>GPT-4's multimodal capabilities and enhanced reasoning abilities are setting new standards in AI development...</p>`,
    category: "Industry News",
    readTime: "8 min read",
    imageUrl: "https://images.unsplash.com/photo-1677442136019-21780ecad995",
    tags: ["AI", "GPT-4", "Machine Learning", "Future Tech"],
    status: "published",
    author: {
      name: "Sarah Chen",
      avatar: "https://ui-avatars.com/api/?name=Sarah+Chen&background=random",
    }
  },
  {
    title: "Building Ethical AI Systems",
    slug: "building-ethical-ai-systems",
    excerpt: "<p>A comprehensive guide to implementing ethical considerations in AI development, ensuring responsible and unbiased artificial intelligence systems.</p>",
    content: `<h1>Building Ethical AI Systems</h1>
    <p>As AI becomes increasingly integrated into our daily lives, ensuring ethical implementation is crucial...</p>
    <h2>Key Principles of Ethical AI</h2>
    <p>Transparency, accountability, and fairness form the foundation of ethical AI development...</p>`,
    category: "Best Practices",
    readTime: "12 min read",
    imageUrl: "https://images.unsplash.com/photo-1515378960530-7c0da6231fb1",
    tags: ["Ethics", "AI Development", "Best Practices"],
    status: "published",
    author: {
      name: "Michael Rodriguez",
      avatar: "https://ui-avatars.com/api/?name=Michael+Rodriguez&background=random",
    }
  },
  {
    title: "Optimizing Machine Learning Models for Production",
    slug: "optimizing-ml-models-for-production",
    excerpt: "<p>Learn essential techniques for optimizing and deploying machine learning models in production environments, ensuring efficiency and reliability.</p>",
    content: `<h1>Optimizing Machine Learning Models for Production</h1>
    <p>Deploying ML models in production requires careful consideration of performance, scalability, and maintenance...</p>
    <h2>Performance Optimization Techniques</h2>
    <p>From model compression to efficient serving strategies, optimization is key to successful deployment...</p>`,
    category: "MLOps",
    readTime: "15 min read",
    imageUrl: "https://images.unsplash.com/photo-1555949963-aa79dcee981c",
    tags: ["MLOps", "Performance", "DevOps", "Machine Learning"],
    status: "published",
    author: {
      name: "David Kumar",
      avatar: "https://ui-avatars.com/api/?name=David+Kumar&background=random",
    }
  },
  {
    title: "Computer Vision in Healthcare",
    slug: "computer-vision-in-healthcare",
    excerpt: "<p>Discover how computer vision is revolutionizing healthcare, from diagnostic imaging to surgical assistance and patient monitoring.</p>",
    content: `<h1>Computer Vision in Healthcare</h1>
    <p>Computer vision technologies are transforming healthcare delivery and patient outcomes...</p>
    <h2>Applications in Medical Imaging</h2>
    <p>Advanced image recognition systems are enhancing diagnostic accuracy and efficiency...</p>`,
    category: "Computer Vision",
    readTime: "10 min read",
    imageUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d",
    tags: ["Healthcare", "Computer Vision", "Medical AI"],
    status: "published",
    author: {
      name: "Emily Johnson",
      avatar: "https://ui-avatars.com/api/?name=Emily+Johnson&background=random",
    }
  },
  {
    title: "Natural Language Processing Breakthroughs",
    slug: "nlp-breakthroughs-2024",
    excerpt: "<p>Explore the latest breakthroughs in Natural Language Processing and their implications for business and technology.</p>",
    content: `<h1>Natural Language Processing Breakthroughs</h1>
    <p>Recent advances in NLP are pushing the boundaries of human-machine interaction...</p>
    <h2>Transformer Architecture Evolution</h2>
    <p>New architectural improvements are enabling more efficient and capable language models...</p>`,
    category: "Natural Language Processing",
    readTime: "11 min read",
    imageUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5",
    tags: ["NLP", "AI", "Language Models"],
    status: "published",
    author: {
      name: "Alex Thompson",
      avatar: "https://ui-avatars.com/api/?name=Alex+Thompson&background=random",
    }
  },
  {
    title: "Securing AI Applications",
    slug: "securing-ai-applications",
    excerpt: "<p>A comprehensive guide to implementing robust security measures in AI applications, protecting against vulnerabilities and attacks.</p>",
    content: `<h1>Securing AI Applications</h1>
    <p>As AI systems become more prevalent, securing them against attacks is crucial...</p>
    <h2>Common Security Vulnerabilities</h2>
    <p>Understanding and mitigating security risks in AI systems requires a comprehensive approach...</p>`,
    category: "AI Security",
    readTime: "13 min read",
    imageUrl: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b",
    tags: ["Security", "AI", "Cybersecurity"],
    status: "published",
    author: {
      name: "Lisa Wang",
      avatar: "https://ui-avatars.com/api/?name=Lisa+Wang&background=random",
    }
  },
  {
    title: "Edge AI: Computing at the Frontier",
    slug: "edge-ai-computing-frontier",
    excerpt: "<p>Learn about the latest developments in Edge AI and how it's enabling real-time processing and decision-making at the edge.</p>",
    content: `<h1>Edge AI: Computing at the Frontier</h1>
    <p>Edge computing is revolutionizing how AI applications are deployed and operated...</p>
    <h2>Benefits of Edge AI</h2>
    <p>Reduced latency, improved privacy, and enhanced reliability are driving Edge AI adoption...</p>`,
    category: "Edge Computing",
    readTime: "9 min read",
    imageUrl: "https://images.unsplash.com/photo-1518432031352-d6fc5c10da5a",
    tags: ["Edge Computing", "AI", "IoT"],
    status: "published",
    author: {
      name: "James Wilson",
      avatar: "https://ui-avatars.com/api/?name=James+Wilson&background=random",
    }
  },
  {
    title: "AI Project Management Best Practices",
    slug: "ai-project-management-best-practices",
    excerpt: "<p>Master the art of managing AI projects with these proven best practices and methodologies for successful delivery.</p>",
    content: `<h1>AI Project Management Best Practices</h1>
    <p>Successfully managing AI projects requires a unique approach to traditional project management...</p>
    <h2>Key Success Factors</h2>
    <p>From data strategy to team composition, various factors influence AI project success...</p>`,
    category: "Project Management",
    readTime: "14 min read",
    imageUrl: "https://images.unsplash.com/photo-1552664730-d307ca884978",
    tags: ["Project Management", "AI", "Best Practices"],
    status: "published",
    author: {
      name: "Rachel Adams",
      avatar: "https://ui-avatars.com/api/?name=Rachel+Adams&background=random",
    }
  }
];

async function createSampleBlogPosts() {
  try {
    console.log('Connecting to MongoDB:', MONGODB_URI);
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Delete existing posts
    await BlogPost.deleteMany({});
    console.log('Cleared existing blog posts');

    // Add current date to each post
    const postsWithDates = samplePosts.map(post => ({
      ...post,
      date: new Date().toISOString(),
      createdAt: new Date(),
      updatedAt: new Date(),
      likes: Math.floor(Math.random() * 100),
      comments: Math.floor(Math.random() * 20),
    }));

    // Create new posts
    const createdPosts = await BlogPost.insertMany(postsWithDates);
    console.log(`Created ${createdPosts.length} sample blog posts`);

    // Log the created posts
    createdPosts.forEach(post => {
      console.log(`Created post: ${post.title} (${post.slug})`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
}

createSampleBlogPosts(); 