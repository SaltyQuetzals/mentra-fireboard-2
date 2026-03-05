# manager/

Per-user manager classes. Each manager handles one responsibility and is instantiated inside the `User` class (`session/User.ts`).

| Class                    | Responsibility                                      |
| ------------------------ | --------------------------------------------------- |
| `SessionManager`         | Thin lookup — `Map<userId, User>` with get/create/remove |
| `StorageManager`         | Theme preferences via MentraOS Simple Storage       |

Every manager (except `SessionManager`) receives a back-reference to its `User` so it can access `this.user.appSession` and `this.user.userId`.
