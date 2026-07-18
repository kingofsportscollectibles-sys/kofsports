import { StructureResolver } from "sanity/structure";

export const structure: StructureResolver = (S) =>
  S.list()
    .title("Content")
    .items([
      S.listItem()
        .title("📰 Free Picks")
        .child(
          S.documentTypeList("article")
            .title("Free Picks")
            .filter('_type == "article" && isPremium != true')
        ),

      S.listItem()
        .title("🔒 VIP Picks")
        .child(
          S.documentTypeList("article")
            .title("🔒 VIP Picks")
            .filter('_type == "article" && isPremium == true')
        ),

      S.listItem()
        .title("📰 News")
        .child(
          S.documentTypeList("article")
            .title("News")
            .filter('_type == "article" && contentType == "news"')
        ),

      S.listItem()
        .title("📚 Betting Education")
        .child(
          S.documentTypeList("article")
            .title("Betting Education")
            .filter('_type == "article" && contentType == "betting-education"')
        ),

      S.listItem()
        .title("📢 KofSports Updates")
        .child(
          S.documentTypeList("article")
            .title("KofSports Updates")
            .filter('_type == "article" && contentType == "kofsports-update"')
        ),

      S.divider(),

      S.listItem()
        .title("⭐ Featured")
        .child(
          S.documentTypeList("article")
            .title("Featured")
            .filter('_type == "article" && featured == true')
        ),

      S.listItem()
        .title("📄 All Content")
        .child(
          S.documentTypeList("article")
            .title("All Articles")
        ),
    ]);