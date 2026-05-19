# File I/O System Calls

## 4.1 What is a File Descriptor?

The OS gives you an integer called a **file descriptor** (fd) every time you successfully open a file. It is just a number, but behind the scenes the kernel uses it to track which file you mean and where you are in it.

Three file descriptors always exist:
- `0` - standard input (keyboard)
- `1` - standard output (screen)
- `2` - standard error

When you `open()` a file, you get fd `3`, then `4`, and so on.

---

## 4.2 open and close

```c
#include <sys/types.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <unistd.h>

/* Open for reading */
int fd = open("myfile.dat", O_RDONLY);

/* Open for writing: create if absent, overwrite if present */
int fd = open("myfile.dat", O_WRONLY | O_CREAT | O_TRUNC, S_IRWXU);

/* Open for writing: create if absent, APPEND if present */
int fd = open("myfile.dat", O_WRONLY | O_CREAT | O_APPEND, S_IRWXU);

close(fd);   /* always close when done */
```

`S_IRWXU` sets read, write, and execute permission for the file owner.

---

## 4.3 read and write

`read()` and `write()` use `void *` buffers, which means you can pass any type, including structs. The third argument is always the number of bytes, so use `sizeof()` for structs.

```c
/* Lab 4, Q4: read a text file and print it */
#include <stdio.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <unistd.h>

int main() {
    int fd, n;
    char buf[64];

    fd = open("lab44.dat", O_RDONLY);
    if (fd == -1) {
        perror("open failed");
        return 1;
    }

    /* keep reading 63 bytes at a time until read() returns 0 (EOF) */
    while ((n = read(fd, buf, 63)) > 0) {
        buf[n] = '\0';
        printf("%s", buf);
    }

    close(fd);
    return 0;
}
```

**Writing a struct to a file (Lab 4, Q8):**

```c
struct Student {
    char  name[20];
    char  id[10];
    char  dob[10];
    char  gender[7];
    char  status[10];
};

/* Write one struct */
write(fd, &s, sizeof(struct Student));

/* Read one struct */
read(fd, &s, sizeof(struct Student));
```

> **Note:** `sizeof(struct Student)` gives the exact number of bytes the struct occupies. This is why `sizeof()` is essential for binary file I/O.

---

## 4.4 lseek - Random Access

`lseek()` moves the file position pointer without reading or writing, so you can jump directly to a specific record (Lab 4, Q9).

```c
/* Jump to the 5th student record (0-indexed: record 4) */
int record_num = 4;
lseek(fd, record_num * sizeof(struct Student), SEEK_SET);
read(fd, &s, sizeof(struct Student));
```

`SEEK_SET` means the offset is measured from the beginning of the file. `SEEK_CUR` means from the current position. `SEEK_END` means from the end.

---