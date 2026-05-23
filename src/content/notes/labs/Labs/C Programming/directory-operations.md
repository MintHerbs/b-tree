# Directory Operations

## 9.1 Creating Directories - mkdir

The `mkdir()` system call creates a new directory. The second argument is the permission mode (same format as `chmod`).

```c
/* Lab 9, Q1 */
#include <stdio.h>
#include <sys/stat.h>

int main() {
    char dirname[255];
    int val;

    printf("Enter directory name: ");
    scanf("%s", dirname);

    val = mkdir(dirname, 0777);   /* 0777 = rwxrwxrwx */

    if (val == 0)
        printf("Directory '%s' created successfully.\n", dirname);
    else
        perror("mkdir failed");

    return 0;
}
```

---

## 9.2 Reading Directory Contents - opendir, readdir, closedir

`opendir()` opens a directory and returns a `DIR *` handle. `readdir()` reads the next entry from the directory, returning a pointer to a `struct dirent`. Always `closedir()` when finished.

The `struct dirent` fields you will use most:

| Field | Type | Meaning |
|-------|------|---------|
| `d_name` | `char[256]` | Filename |
| `d_type` | `unsigned char` | `DT_REG` (file), `DT_DIR` (dir), `DT_LNK` (link), etc. |

```c
/* Lab 9, Q3 - simple ls: list current directory */
#include <stdio.h>
#include <dirent.h>

int main() {
    DIR *dir;
    struct dirent *entry;

    dir = opendir(".");   /* "." means current directory */
    if (dir == NULL) {
        perror("opendir failed");
        return 1;
    }

    while ((entry = readdir(dir)) != NULL) {
        printf("%s\n", entry->d_name);
    }

    closedir(dir);
    return 0;
}
```

**Listing a user-specified directory (Lab 9, Q4), using argc and argv:**

Programs can receive command-line arguments via `argc` (argument count) and `argv` (argument values). `argv[0]` is always the program name. `argv[1]` is the first argument, and so on.

```c
/* Compile as: gcc ls2.c -o ls2 */
/* Run as:     ./ls2 /home/user */

#include <stdio.h>
#include <dirent.h>

int main(int argc, char *argv[]) {
    DIR *dir;
    struct dirent *entry;
    char *path;

    if (argc < 2)
        path = ".";          /* default to current directory */
    else
        path = argv[1];

    dir = opendir(path);
    if (dir == NULL) {
        perror("opendir failed");
        return 1;
    }

    while ((entry = readdir(dir)) != NULL) {
        printf("%s\n", entry->d_name);
    }

    closedir(dir);
    return 0;
}
```

> **Note on `d_type` values:**
> - `DT_REG` - regular file
> - `DT_DIR` - directory
> - `DT_LNK` - symbolic link
> - `DT_FIFO` - named pipe
> - `DT_UNKNOWN` - unknown (use `stat()` to determine the type)

---

## 9.3 File Details with stat

`stat()` fills a `struct stat` with detailed information about a file: size, permissions, last modification time, and more. This is needed for the `-l` flag in Lab 9, Q5.

```c
/* Lab 9, Q5 - ls with -l option */
#include <stdio.h>
#include <dirent.h>
#include <sys/stat.h>
#include <time.h>
#include <string.h>

int main(int argc, char *argv[]) {
    DIR *dir;
    struct dirent *entry;
    struct stat info;
    char path[512];
    char *dirpath;
    int long_format = 0;
    int i;

    dirpath = ".";

    /* Parse arguments: check for -l flag */
    for (i = 1; i < argc; i++) {
        if (strcmp(argv[i], "-l") == 0)
            long_format = 1;
        else
            dirpath = argv[i];
    }

    dir = opendir(dirpath);
    if (dir == NULL) { perror("opendir"); return 1; }

    while ((entry = readdir(dir)) != NULL) {
        if (long_format) {
            snprintf(path, sizeof(path), "%s/%s", dirpath, entry->d_name);
            stat(path, &info);
            printf("%10ld  %.24s  %s\n",
                   (long)info.st_size,
                   ctime(&info.st_mtime),
                   entry->d_name);
        } else {
            printf("%s\n", entry->d_name);
        }
    }

    closedir(dir);
    return 0;
}
/* Compile: gcc ls3.c -o ls3 */
/* Run:     ./ls3 -l /home/user */
```

---

## 9.4 Recursive Directory Listing - ls with -R

For the recursive version (Lab 9, Q6), you check whether each entry is a directory (`DT_DIR`), skip `.` and `..`, and recurse into subdirectories.

```c
/* Lab 9, Q6 - recursive ls */
#include <stdio.h>
#include <dirent.h>
#include <string.h>

void listDir(char *path) {
    DIR *dir;
    struct dirent *entry;
    char subpath[512];

    dir = opendir(path);
    if (dir == NULL) { perror("opendir"); return; }

    printf("\n--- %s ---\n", path);

    while ((entry = readdir(dir)) != NULL) {
        /* skip . and .. */
        if (strcmp(entry->d_name, ".") == 0 ||
            strcmp(entry->d_name, "..") == 0)
            continue;

        printf("%s\n", entry->d_name);

        if (entry->d_type == DT_DIR) {
            snprintf(subpath, sizeof(subpath),
                     "%s/%s", path, entry->d_name);
            listDir(subpath);   /* recurse */
        }
    }

    closedir(dir);
}

int main(int argc, char *argv[]) {
    char *path = (argc >= 2) ? argv[1] : ".";
    listDir(path);
    return 0;
}
```

> **Note:** When deleting directories recursively (Lab 9, Q10), use `unlink()` to remove a regular file and `rmdir()` to remove an empty directory. You must delete all contents before `rmdir()` will succeed, which is why this also requires a recursive approach similar to the listing above.

---

*End of Part 1 - C Programming*