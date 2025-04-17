### Useful files:

-   Badges.csv: Id,UserId,Name,Date,Class,TagBased
-   Comments.csv: Id,PostId,Score,Text,CreationDate,UserId,ContentLicense
-   PostHistory.csv: Id,PostHistoryTypeId,PostId,RevisionGUID,CreationDate,UserId,Text,ContentLicense
-   PostLinks.csv: Id,CreationDate,PostId,RelatedPostId,LinkTypeId
-   Posts.csv: Id,PostTypeId,AcceptedAnswerId,CreationDate,Score,ViewCount,Body,OwnerUserId,LastEditorUserId,LastEditDate,LastActivityDate,Title,Tags,AnswerCount,CommentCount,ContentLicense
-   Tags.csv: Id,TagName,Count,ExcerptPostId,WikiPostId
-   Users.csv: Id,Reputation,CreationDate,DisplayName,LastAccessDate,Location,AboutMe,Views,UpVotes,DownVotes,AccountId
-   Votes.csv: Id,PostId,VoteTypeId,CreationDate

### Useful tables:

#### threads:

-   id: uuid (automatic)
-   course_id: uuid
-   title: text
-   content: text
-   tags: text[]
-   creator_id: uuid
-   creator_role: text
-   created_at: timestamptz
-   updated_at: timestamptz
-   embedding: vector

#### comments:

-   id: uuid (automatic)
-   thread_id: uuid
-   content: text
-   creator_id: uuid
-   creator_role: text
-   created_at: timestamptz
-   updated_at: timestamptz
-   parent_id: uuid (just make NULL)
-   embedding: vector

#### courses: (MANUALLY CREATE FOR DATA POPULATION)

Order of implementation:

1. make course manually
2. thread population
3. (out of scope) comments population (will require anonymous name updates)
