import React from "react";
import { RichTextEditor } from "rc-rich-text-editor";
// import { RichTextEditor } from "../../src";

function App() {
  return (
    <div className='root'>
      <div>App</div>

      <RichTextEditor
        id='test'
        name='test'
        label='testing label'
        onTextChange={(content) => {
          // console.log(content);
        }}
        placeholder='placeholder'

        // initialValues={`<p>​fdsf sdfsd fsdfsd&nbsp;</p><p>​ dsf sfsdfsd f sdf sd</p><p>​f dsf sd&nbsp;<span data-stylenames="bold" style="font-weight:bold;">​ sdf sd sd</span></p><p>​fsdf sdfd</p><p>​f sd</p><p>​f sdf&nbsp;</p><p>​fds</p><p>​f&nbsp;</p><p>​sf&nbsp;</p>`}
      />
    </div>
  );
}

export default App;
