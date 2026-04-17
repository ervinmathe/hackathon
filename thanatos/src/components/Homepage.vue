<script setup>

</script>


<template>
    <header>
        <nav class="headernavigation">
            <img src="">
            <a href="#" @click.prevent="$router.replace('/')">Log Out</a>
        </nav>
    </header>
    <section>
        <h1>Home Page</h1>
        <p>Hello</p>
        <a>cs</a>
    </section>
</template>

<style scoped>


header {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: right;
}

header nav {
    margin-left: auto;
    margin-right: 20px;
    margin-top: 10px;
}

header nav a {
    color: var(--universallogouttextcolor);
    text-decoration: none;
    font-weight: bold;
}
</style>

