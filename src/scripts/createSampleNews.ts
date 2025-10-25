import 'dotenv/config';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { NewsPost } from '../db/models/NewsPost.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-hunt';

const samplePosts = [
  {
    title: "OpenAI Announces GPT-5 Development Plans",
    excerpt: "The company reveals ambitious plans for the next generation of language models, promising breakthrough capabilities in reasoning and multimodal understanding.",
    content: `<h1>OpenAI Announces GPT-5 Development Plans</h1>
    <p>OpenAI has officially announced its plans for developing GPT-5, the next iteration of its groundbreaking language model series. This announcement marks a significant milestone in the field of artificial intelligence and machine learning.</p>
    <h2>Key Features and Improvements</h2>
    <ul>
      <li>Enhanced reasoning capabilities</li>
      <li>Improved multimodal understanding</li>
      <li>Better context retention</li>
      <li>More efficient training process</li>
    </ul>
    <p>The development is expected to take several months, with rigorous testing and safety measures in place.</p>`,
    category: "AI Development",
    imageUrl: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=800",
    tags: ["OpenAI", "GPT-5", "AI Development", "Machine Learning"],
    status: "published",
    source: "TechCrunch",
    sourceUrl: "https://techcrunch.com",
    author: {
      name: "Sarah Chen",
      avatar: "https://ui-avatars.com/api/?name=Sarah+Chen&background=random",
    }
  },
  {
    title: "Google's DeepMind Achieves Breakthrough in Protein Folding",
    excerpt: "New AI model predicts protein structures with unprecedented accuracy, potentially revolutionizing drug discovery and medical research.",
    content: `<h1>DeepMind's Latest Breakthrough in Protein Folding</h1>
    <p>Google's DeepMind has announced a significant breakthrough in protein structure prediction, achieving unprecedented accuracy levels that could revolutionize drug discovery and medical research.</p>
    <h2>Impact on Medical Research</h2>
    <p>This advancement has far-reaching implications for:</p>
    <ul>
      <li>Drug development</li>
      <li>Disease treatment</li>
      <li>Protein engineering</li>
    </ul>`,
    category: "Research",
    imageUrl: "https://images.unsplash.com/photo-1633167606207-d840b5070fc2?auto=format&fit=crop&w=800",
    tags: ["DeepMind", "Protein Folding", "Medical Research", "AI"],
    status: "published",
    source: "Nature",
    sourceUrl: "https://nature.com",
    author: {
      name: "Michael Rodriguez",
      avatar: "https://ui-avatars.com/api/?name=Michael+Rodriguez&background=random",
    }
  },
  {
    title: "AI Regulation: EU Passes Landmark AI Act",
    excerpt: "European Union approves comprehensive AI regulations, setting global standards for AI development and deployment.",
    content: `<h1>EU's Landmark AI Act: A New Era of AI Regulation</h1>
    <p>The European Union has approved a comprehensive set of regulations for artificial intelligence, establishing global standards for AI development and deployment.</p>
    <h2>Key Regulations</h2>
    <ul>
      <li>Transparency requirements</li>
      <li>Safety standards</li>
      <li>Ethical guidelines</li>
      <li>Compliance measures</li>
    </ul>`,
    category: "Policy",
    imageUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800",
    tags: ["AI Regulation", "EU", "Policy", "AI Ethics"],
    status: "published",
    source: "Reuters",
    sourceUrl: "https://reuters.com",
    author: {
      name: "Anna Schmidt",
      avatar: "https://ui-avatars.com/api/?name=Anna+Schmidt&background=random",
    }
  },
  {
    title: "Microsoft Integrates Advanced AI Features Across Office Suite",
    excerpt: "New AI-powered features in Microsoft 365 promise to revolutionize productivity and collaboration.",
    content: `<h1>Microsoft's AI Revolution in Office Suite</h1>
    <p>Microsoft has announced a major update to its Office suite, integrating advanced AI features across all applications to enhance productivity and collaboration.</p>
    <h2>New Features</h2>
    <ul>
      <li>AI-powered writing assistance</li>
      <li>Smart data analysis</li>
      <li>Automated presentation design</li>
      <li>Intelligent email composition</li>
    </ul>`,
    category: "Product Update",
    imageUrl: "https://images.unsplash.com/photo-1661961110671-77b71b929d52?auto=format&fit=crop&w=800",
    tags: ["Microsoft", "Office 365", "AI Features", "Productivity"],
    status: "published",
    source: "The Verge",
    sourceUrl: "https://theverge.com",
    author: {
      name: "David Kumar",
      avatar: "https://ui-avatars.com/api/?name=David+Kumar&background=random",
    }
  },
  {
    title: "Meta's AI Translation Model Breaks Language Barriers",
    excerpt: "Revolutionary new AI system can translate between 200 languages in real-time with human-level accuracy.",
    content: `<h1>Meta's Revolutionary AI Translation System</h1>
    <p>Meta has unveiled a groundbreaking AI translation system capable of translating between 200 languages in real-time with unprecedented accuracy.</p>
    <h2>Technical Achievements</h2>
    <ul>
      <li>Real-time translation</li>
      <li>200 language support</li>
      <li>Human-level accuracy</li>
      <li>Low latency processing</li>
    </ul>`,
    category: "AI Development",
    imageUrl: "https://images.unsplash.com/photo-1589254065878-42c9da997008?auto=format&fit=crop&w=800",
    tags: ["Meta", "AI Translation", "Language Processing", "Machine Learning"],
    status: "published",
    source: "Wired",
    sourceUrl: "https://wired.com",
    author: {
      name: "Lisa Wang",
      avatar: "https://ui-avatars.com/api/?name=Lisa+Wang&background=random",
    }
  }
];

async function createSampleNewsPosts() {
  try {
    console.log('Connecting to MongoDB:', MONGODB_URI);
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Delete existing posts
    await NewsPost.deleteMany({});
    console.log('Cleared existing news posts');

    // Add current date to each post
    const postsWithDates = samplePosts.map(post => ({
      ...post,
      date: new Date().toISOString(),
      createdAt: new Date(),
      updatedAt: new Date(),
      views: Math.floor(Math.random() * 1000),
      shares: Math.floor(Math.random() * 100),
      slug: post.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    }));

    // Create new posts
    const createdPosts = await NewsPost.insertMany(postsWithDates);
    console.log(`Created ${createdPosts.length} sample news posts`);

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

createSampleNewsPosts(); 