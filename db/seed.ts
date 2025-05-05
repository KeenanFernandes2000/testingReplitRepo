import { db } from "./index";
import * as schema from "@shared/schema";
import { eq } from "drizzle-orm";
import { addDays, subHours } from "date-fns";

async function seed() {
  try {
    console.log("Starting database seed...");

    // Create sample tags
    const tagNames = ["Daily Life", "Travel", "Creative", "Friends", "Food", "Tech", "Fitness"];
    const tagIds: Record<string, number> = {};

    for (const name of tagNames) {
      const existingTag = await db.query.tags.findFirst({
        where: eq(schema.tags.name, name)
      });

      if (existingTag) {
        tagIds[name] = existingTag.id;
        console.log(`Tag '${name}' already exists with ID ${existingTag.id}`);
      } else {
        const [newTag] = await db.insert(schema.tags).values({ name }).returning();
        tagIds[name] = newTag.id;
        console.log(`Created tag '${name}' with ID ${newTag.id}`);
      }
    }

    // Create sample users (if they don't exist)
    const users = [
      {
        username: "alexmorgan",
        displayName: "Alex Morgan",
        email: "alexmorgan@example.com",
        googleId: "google_123456_alex",
        avatarUrl: "https://i.pravatar.cc/150?img=8",
        bio: "Filmmaker, travel enthusiast, and coffee addict. Sharing my adventures and everyday moments.",
        followersCount: 247,
        followingCount: 127
      },
      {
        username: "jamiewilson",
        displayName: "Jamie Wilson",
        email: "jamiewilson@example.com",
        googleId: "google_123456_jamie",
        avatarUrl: "https://i.pravatar.cc/150?img=26",
        bio: "Digital nomad working remotely from coffee shops around the world.",
        followersCount: 126,
        followingCount: 83
      },
      {
        username: "sarahj",
        displayName: "Sarah Johnson",
        email: "sarahj@example.com",
        googleId: "google_123456_sarah",
        avatarUrl: "https://i.pravatar.cc/150?img=1",
        bio: "Amateur chef and bookworm. Sharing recipes and book reviews.",
        followersCount: 352,
        followingCount: 92
      },
      {
        username: "emilychen",
        displayName: "Emily Chen",
        email: "emilychen@example.com",
        googleId: "google_123456_emily",
        avatarUrl: "https://i.pravatar.cc/150?img=12",
        bio: "Filmmaker, travel enthusiast, and coffee addict. Sharing my adventures and everyday moments.",
        followersCount: 3200,
        followingCount: 127
      }
    ];

    const userIds: Record<string, number> = {};

    for (const userData of users) {
      const existingUser = await db.query.users.findFirst({
        where: eq(schema.users.username, userData.username)
      });

      if (existingUser) {
        userIds[userData.username] = existingUser.id;
        console.log(`User '${userData.username}' already exists with ID ${existingUser.id}`);
      } else {
        const [newUser] = await db.insert(schema.users).values({
          ...userData,
          googleAccessToken: "mock_access_token",
          googleRefreshToken: "mock_refresh_token",
          googleTokenExpiry: addDays(new Date(), 7),
          createdAt: new Date(),
          updatedAt: new Date()
        }).returning();
        userIds[userData.username] = newUser.id;
        console.log(`Created user '${userData.username}' with ID ${newUser.id}`);
      }
    }

    // Create sample vlogs (if they don't exist)
    const vlogs = [
      {
        userId: userIds["alexmorgan"],
        title: "Mountain hiking weekend getaway!",
        description: "Finally got to hike Mount Rainier this weekend - the views were absolutely incredible! #hiking #nature #weekend",
        youtubeId: "youtube_123456_alex_1",
        thumbnailUrl: "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800&auto=format&fit=crop&q=60",
        duration: "06:24",
        createdAt: subHours(new Date(), 16),
        expiresAt: addDays(subHours(new Date(), 16), 3),
        likesCount: 247,
        tags: ["Travel", "Fitness"]
      },
      {
        userId: userIds["jamiewilson"],
        title: "A day working from my favorite coffee shop",
        description: "Productive day at Ritual Coffee today! Sharing my remote work setup and some thoughts on my current project. #remotework #productivity",
        youtubeId: "youtube_123456_jamie_1",
        thumbnailUrl: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800&auto=format&fit=crop&q=60",
        duration: "08:17",
        createdAt: subHours(new Date(), 24),
        expiresAt: addDays(subHours(new Date(), 24), 3),
        likesCount: 126,
        tags: ["Daily Life", "Tech"]
      },
      {
        userId: userIds["sarahj"],
        title: "Making grandma's secret recipe pasta!",
        description: "Finally tried making my grandma's secret pasta recipe and it turned out amazing! Going to share the process and show you how it turned out. #homecooking #familyrecipes",
        youtubeId: "youtube_123456_sarah_1",
        thumbnailUrl: "https://images.unsplash.com/photo-1525201548942-d8732f6617a0?w=800&auto=format&fit=crop&q=60",
        duration: "12:53",
        createdAt: subHours(new Date(), 62),
        expiresAt: addDays(subHours(new Date(), 62), 3),
        likesCount: 352,
        tags: ["Food", "Daily Life"]
      },
      {
        userId: userIds["emilychen"],
        title: "Tokyo street food adventure",
        description: "Explored the amazing street food scene in Tokyo! So many delicious things to try! #japan #streetfood #travel",
        youtubeId: "youtube_123456_emily_1",
        thumbnailUrl: "https://images.unsplash.com/photo-1549451371-64aa98a6f660?w=800&auto=format&fit=crop&q=60",
        duration: "09:31",
        createdAt: subHours(new Date(), 49),
        expiresAt: addDays(subHours(new Date(), 49), 3),
        likesCount: 543,
        tags: ["Travel", "Food"]
      },
      {
        userId: userIds["emilychen"],
        title: "My productive morning routine",
        description: "Sharing my morning routine that helps me stay productive throughout the day. #productivity #routine #mornings",
        youtubeId: "youtube_123456_emily_2",
        thumbnailUrl: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800&auto=format&fit=crop&q=60",
        duration: "07:15",
        createdAt: subHours(new Date(), 24),
        expiresAt: addDays(subHours(new Date(), 24), 3),
        likesCount: 267,
        tags: ["Daily Life"]
      },
      // Expired vlogs
      {
        userId: userIds["emilychen"],
        title: "Sunset from my apartment window",
        description: "Caught an amazing sunset from my apartment window tonight. #sunset #views",
        youtubeId: "youtube_123456_emily_3",
        thumbnailUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop&q=60",
        duration: "07:24",
        createdAt: subHours(new Date(), 73),
        expiresAt: subHours(new Date(), 1), // Already expired
        likesCount: 198,
        tags: ["Daily Life"]
      },
      {
        userId: userIds["emilychen"],
        title: "Book review: The Midnight Library",
        description: "My thoughts on 'The Midnight Library' by Matt Haig. #books #reading #review",
        youtubeId: "youtube_123456_emily_4",
        thumbnailUrl: "https://images.unsplash.com/photo-1485217988980-11786ced9454?w=800&auto=format&fit=crop&q=60",
        duration: "12:52",
        createdAt: subHours(new Date(), 74),
        expiresAt: subHours(new Date(), 2), // Already expired
        likesCount: 321,
        tags: ["Creative"]
      }
    ];

    for (const vlogData of vlogs) {
      const { tags: vlogTags, ...vlogInfo } = vlogData;
      
      // Check if vlog already exists
      const existingVlog = await db.query.vlogs.findFirst({
        where: eq(schema.vlogs.youtubeId, vlogInfo.youtubeId)
      });

      if (existingVlog) {
        console.log(`Vlog '${vlogData.title}' already exists with ID ${existingVlog.id}`);
      } else {
        // Create vlog
        const [newVlog] = await db.insert(schema.vlogs).values(vlogInfo).returning();
        console.log(`Created vlog '${vlogData.title}' with ID ${newVlog.id}`);

        // Associate tags
        for (const tagName of vlogTags) {
          if (tagIds[tagName]) {
            await db.insert(schema.vlogTags).values({
              vlogId: newVlog.id,
              tagId: tagIds[tagName]
            });
            console.log(`Associated tag '${tagName}' with vlog ID ${newVlog.id}`);
          }
        }
      }
    }

    // Create follow relationships
    const follows = [
      { follower: "alexmorgan", following: "jamiewilson" },
      { follower: "alexmorgan", following: "sarahj" },
      { follower: "alexmorgan", following: "emilychen" },
      { follower: "jamiewilson", following: "alexmorgan" },
      { follower: "jamiewilson", following: "emilychen" },
      { follower: "sarahj", following: "alexmorgan" },
      { follower: "sarahj", following: "jamiewilson" },
      { follower: "sarahj", following: "emilychen" },
      { follower: "emilychen", following: "alexmorgan" },
      { follower: "emilychen", following: "jamiewilson" }
    ];

    for (const { follower, following } of follows) {
      if (userIds[follower] && userIds[following]) {
        const existingFollow = await db.query.follows.findFirst({
          where: (fields) => 
            eq(fields.followerId, userIds[follower]) && 
            eq(fields.followingId, userIds[following])
        });

        if (!existingFollow) {
          await db.insert(schema.follows).values({
            followerId: userIds[follower],
            followingId: userIds[following],
            createdAt: new Date()
          });
          console.log(`Created follow relationship: ${follower} -> ${following}`);
        } else {
          console.log(`Follow relationship already exists: ${follower} -> ${following}`);
        }
      }
    }

    console.log("Database seed completed successfully!");
  } catch (error) {
    console.error("Seed error:", error);
  }
}

seed();
